from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.object import ObjectCreate
from app.services.objects import create_object, delete_object
from app.services.spatial import get_geojson, get_object_spatial

pytestmark = pytest.mark.asyncio

TENANT_ID = uuid4()


async def _create_object(session: AsyncSession, object_type, key: str, name: str, status: str = "NORMAL"):
    return await create_object(
        session,
        ObjectCreate(
            tenant_id=TENANT_ID,
            object_type_id=object_type.id,
            parent_id=None,
            key=key,
            name=name,
            properties={},
            status=status,
        ),
    )


async def _add_spatial(
    session: AsyncSession,
    object_id,
    longitude: float,
    latitude: float,
    source: str = "test",
):
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
                :source
            )
            """
        ),
        {
            "id": uuid4(),
            "object_id": object_id,
            "longitude": longitude,
            "latitude": latitude,
            "source": source,
        },
    )
    await session.commit()


async def test_spatial_record_belongs_to_existing_object(session: AsyncSession, object_type):
    object_item = await _create_object(session, object_type, "site-a", "Site A")
    await _add_spatial(session, object_item.id, 13.7557, 51.0348)

    spatial = await get_object_spatial(session, object_item.id)

    assert spatial.object_id == object_item.id
    assert spatial.geometry.type == "Point"
    assert spatial.geometry.coordinates == (13.7557, 51.0348)


async def test_geojson_returns_valid_feature_collection(session: AsyncSession, object_type):
    object_item = await _create_object(session, object_type, "dresden-site", "Dresden Site", "WARNING")
    await _add_spatial(session, object_item.id, 13.7557, 51.0348)

    geojson = await get_geojson(session)

    assert geojson.type == "FeatureCollection"
    assert len(geojson.features) == 1
    feature = geojson.features[0]
    assert feature.geometry.coordinates == (13.7557, 51.0348)
    assert feature.properties["object_id"] == object_item.id
    assert feature.properties["name"] == "Dresden Site"
    assert feature.properties["status"] == "WARNING"
    assert feature.properties["object_type"] == object_type.name


async def test_geojson_bbox_filters_points(session: AsyncSession, object_type):
    inside = await _create_object(session, object_type, "inside", "Inside")
    outside = await _create_object(session, object_type, "outside", "Outside")
    await _add_spatial(session, inside.id, 13.7557, 51.0348)
    await _add_spatial(session, outside.id, -73.9857, 40.7484)

    geojson = await get_geojson(session, bbox="13.0,50.5,14.2,51.5")

    object_ids = {feature.properties["object_id"] for feature in geojson.features}
    assert object_ids == {inside.id}


async def test_object_without_spatial_data_is_not_returned(session: AsyncSession, object_type):
    await _create_object(session, object_type, "without-spatial", "Without Spatial")

    geojson = await get_geojson(session)

    assert geojson.features == []


async def test_deleting_object_safely_removes_spatial_record(session: AsyncSession, object_type):
    object_item = await _create_object(session, object_type, "deletable-site", "Deletable Site")
    await _add_spatial(session, object_item.id, 13.7557, 51.0348)

    await delete_object(session, object_item.id)

    geojson = await get_geojson(session)
    assert geojson.features == []
