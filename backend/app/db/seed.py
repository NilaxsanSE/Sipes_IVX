import asyncio
from uuid import UUID, uuid4

from sqlalchemy import select, text

from app.db.session import AsyncSessionLocal
from app.models.object import Object
from app.models.object_type import ObjectType, ObjectTypeVersion
from app.models.view import View, ViewElement

DEMO_TENANT_ID = UUID("11111111-1111-1111-1111-111111111111")

DEMO_HIERARCHY = [
    ("country", "germany", "Germany", "NORMAL"),
    ("state", "sachsen", "Sachsen", "NORMAL"),
    ("city", "dresden", "Dresden", "NORMAL"),
    ("site", "site-01", "Site 01", "NORMAL"),
    ("plant", "storage-plant", "Storage Plant", "WARNING"),
    ("container", "container-01", "Container 01", "NORMAL"),
    ("fan", "fan-01", "Fan 01", "UNKNOWN"),
]

DEMO_SPATIAL_POINTS = {
    "germany": {"longitude": 10.4515, "latitude": 51.1657, "source": "demo-wgs84"},
    "sachsen": {"longitude": 13.4589, "latitude": 51.1045, "source": "demo-wgs84"},
    "dresden": {"longitude": 13.7373, "latitude": 51.0504, "source": "demo-wgs84"},
    "site-01": {"longitude": 13.7557, "latitude": 51.0348, "source": "demo-wgs84"},
}

DEMO_STORAGE_PLANT_SCHEMATIC = {
    "name": "Storage Plant Schematic",
    "configuration": {
        "drawio": {
            "enabled": True,
            "mode": "self-hosted",
            "editor_url": "http://localhost:8081",
        },
        "canvas": {"width": 900, "height": 420},
    },
    "elements": {
        "container-01": {
            "x": 160,
            "y": 130,
            "width": 250,
            "height": 140,
            "shape": "container",
        },
        "fan-01": {
            "x": 545,
            "y": 150,
            "width": 150,
            "height": 110,
            "shape": "fan",
        },
    },
}


async def _get_or_create_object_type(session, key: str, name: str) -> ObjectType:
    object_type = await session.scalar(select(ObjectType).where(ObjectType.key == key))
    if object_type:
        return object_type

    object_type = ObjectType(key=key, name=name, description=f"Demo {name.lower()} object type.")
    session.add(object_type)
    await session.flush()
    session.add(
        ObjectTypeVersion(
            object_type_id=object_type.id,
            version=1,
            schema_definition={"type": "object", "properties": {}},
        )
    )
    return object_type


async def seed_demo_data() -> None:
    async with AsyncSessionLocal() as session:
        parent_id = None
        seeded_objects: dict[str, Object] = {}

        for type_key, object_key, object_name, status in DEMO_HIERARCHY:
            object_type = await _get_or_create_object_type(
                session,
                key=type_key,
                name=type_key.replace("-", " ").title(),
            )

            object_item = await session.scalar(
                select(Object).where(Object.tenant_id == DEMO_TENANT_ID, Object.key == object_key)
            )
            if object_item is None:
                object_item = Object(
                    tenant_id=DEMO_TENANT_ID,
                    object_type_id=object_type.id,
                    parent_id=parent_id,
                    key=object_key,
                    name=object_name,
                    properties={},
                    status=status,
                )
                session.add(object_item)
                await session.flush()
            else:
                object_item.object_type_id = object_type.id
                object_item.parent_id = parent_id
                object_item.name = object_name
                object_item.status = status

            parent_id = object_item.id
            seeded_objects[object_key] = object_item

        for object_key, point in DEMO_SPATIAL_POINTS.items():
            object_item = seeded_objects[object_key]
            await session.execute(
                text(
                    """
                    INSERT INTO object_spatial (
                        id,
                        object_id,
                        geometry,
                        altitude,
                        source
                    )
                    VALUES (
                        :id,
                        :object_id,
                        ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                        NULL,
                        :source
                    )
                    ON CONFLICT (object_id)
                    DO UPDATE SET
                        geometry = EXCLUDED.geometry,
                        altitude = EXCLUDED.altitude,
                        source = EXCLUDED.source,
                        updated_at = now()
                    """
                ),
                {
                    "id": uuid4(),
                    "object_id": object_item.id,
                    "longitude": point["longitude"],
                    "latitude": point["latitude"],
                    "source": point["source"],
                },
            )

        storage_plant = seeded_objects["storage-plant"]
        schematic_view = await session.scalar(
            select(View).where(View.object_id == storage_plant.id, View.type == "SCHEMATIC")
        )
        if schematic_view is None:
            schematic_view = View(
                object_id=storage_plant.id,
                type="SCHEMATIC",
                name=DEMO_STORAGE_PLANT_SCHEMATIC["name"],
                configuration=DEMO_STORAGE_PLANT_SCHEMATIC["configuration"],
            )
            session.add(schematic_view)
            await session.flush()
        else:
            schematic_view.name = DEMO_STORAGE_PLANT_SCHEMATIC["name"]
            schematic_view.configuration = DEMO_STORAGE_PLANT_SCHEMATIC["configuration"]

        for object_key, layout in DEMO_STORAGE_PLANT_SCHEMATIC["elements"].items():
            element = await session.scalar(
                select(ViewElement).where(
                    ViewElement.view_id == schematic_view.id,
                    ViewElement.element_key == object_key,
                )
            )
            if element is None:
                element = ViewElement(
                    view_id=schematic_view.id,
                    object_id=seeded_objects[object_key].id,
                    element_key=object_key,
                    layout=layout,
                )
                session.add(element)
            else:
                element.object_id = seeded_objects[object_key].id
                element.layout = layout

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
