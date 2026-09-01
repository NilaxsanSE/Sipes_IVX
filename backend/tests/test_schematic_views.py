from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.view import View, ViewElement
from app.schemas.object import ObjectCreate
from app.schemas.view import ViewElementLayoutUpdate
from app.services.objects import create_object
from app.services.spatial import get_object_spatial
from app.services.views import get_object_schematic, get_view, update_element_layout

pytestmark = pytest.mark.asyncio

TENANT_ID = uuid4()


async def _create_object(
    session: AsyncSession,
    object_type,
    key: str,
    name: str,
    parent_id=None,
    status: str = "NORMAL",
):
    return await create_object(
        session,
        ObjectCreate(
            tenant_id=TENANT_ID,
            object_type_id=object_type.id,
            parent_id=parent_id,
            key=key,
            name=name,
            properties={},
            status=status,
        ),
    )


async def _create_schematic(session: AsyncSession, owner_id, elements: list[tuple[str, object, dict]]):
    view = View(
        object_id=owner_id,
        type="SCHEMATIC",
        name="Storage Plant Schematic",
        configuration={"canvas": {"width": 900, "height": 420}},
    )
    session.add(view)
    await session.flush()

    for element_key, object_item, layout in elements:
        session.add(
            ViewElement(
                view_id=view.id,
                object_id=object_item.id,
                element_key=element_key,
                layout=layout,
            )
        )

    await session.commit()
    return view


async def _add_spatial(session: AsyncSession, object_id, longitude: float, latitude: float):
    await session.execute(
        text(
            """
            INSERT INTO object_spatial (
                id,
                object_id,
                geometry,
                source
            )
            VALUES (
                :id,
                :object_id,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                'test'
            )
            """
        ),
        {"id": uuid4(), "object_id": object_id, "longitude": longitude, "latitude": latitude},
    )
    await session.commit()


async def test_schematic_view_loads_for_existing_object(session: AsyncSession, object_type):
    plant = await _create_object(session, object_type, "plant", "Plant")
    container = await _create_object(session, object_type, "container", "Container", parent_id=plant.id)
    fan = await _create_object(session, object_type, "fan", "Fan", parent_id=container.id, status="WARNING")
    await _create_schematic(
        session,
        plant.id,
        [
            ("container", container, {"x": 100, "y": 120, "width": 240, "height": 140}),
            ("fan", fan, {"x": 500, "y": 140, "width": 150, "height": 110}),
        ],
    )

    schematic = await get_object_schematic(session, plant.id)

    assert schematic.object_id == plant.id
    assert schematic.type == "SCHEMATIC"
    assert len(schematic.elements) == 2
    assert {element.object_id for element in schematic.elements} == {container.id, fan.id}


async def test_get_view_includes_bound_elements(session: AsyncSession, object_type):
    plant = await _create_object(session, object_type, "plant", "Plant")
    fan = await _create_object(session, object_type, "fan", "Fan", parent_id=plant.id)
    view = await _create_schematic(session, plant.id, [("fan", fan, {"x": 320, "y": 100})])

    schematic = await get_view(session, view.id)

    assert schematic.elements[0].element_key == "fan"
    assert schematic.elements[0].object_id == fan.id


async def test_missing_schematic_returns_clear_error(session: AsyncSession, object_type):
    plant = await _create_object(session, object_type, "plant", "Plant")

    with pytest.raises(HTTPException) as exc:
        await get_object_schematic(session, plant.id)

    assert exc.value.status_code == 404
    assert exc.value.detail == "Schematic view not found for this object."


async def test_schematic_layout_update_does_not_change_postgis_geometry(session: AsyncSession, object_type):
    plant = await _create_object(session, object_type, "plant", "Plant")
    fan = await _create_object(session, object_type, "fan", "Fan", parent_id=plant.id)
    view = await _create_schematic(session, plant.id, [("fan", fan, {"x": 320, "y": 100})])
    await _add_spatial(session, fan.id, 13.7557, 51.0348)
    before = await get_object_spatial(session, fan.id)
    schematic = await get_view(session, view.id)

    updated = await update_element_layout(
        session,
        schematic.elements[0].id,
        ViewElementLayoutUpdate(layout={"x": 520, "y": 180, "width": 150, "height": 110}),
    )
    after = await get_object_spatial(session, fan.id)

    assert updated.layout["x"] == 520
    assert after.geometry.coordinates == before.geometry.coordinates
