import asyncio
from uuid import UUID, uuid4

from sqlalchemy import select, text

from app.db.session import AsyncSessionLocal
from app.models.object import Object
from app.models.object_type import ObjectType, ObjectTypeVersion
from app.models.view import View, ViewElement

DEMO_TENANT_ID = UUID("11111111-1111-1111-1111-111111111111")

DEMO_OBJECTS = [
    {
        "type_key": "location",
        "key": "dresden",
        "name": "Dresden",
        "status": "WARNING",
        "parent_key": None,
        "properties": {"workflow": "Map entry point with facility drill-down."},
    },
    {
        "type_key": "facility",
        "key": "storage-facility",
        "name": "Storage facility",
        "status": "WARNING",
        "parent_key": "dresden",
        "properties": {"overview": "Primary demo facility for schematic navigation."},
    },
    {
        "type_key": "facility",
        "key": "warehouse",
        "name": "Warehouse",
        "status": "NORMAL",
        "parent_key": "dresden",
        "properties": {"overview": "Second Dresden facility."},
    },
    {
        "type_key": "unit",
        "key": "unit-2",
        "name": "Unit 2",
        "status": "WARNING",
        "parent_key": "storage-facility",
        "properties": {"area": "Storage facility"},
    },
    {
        "type_key": "fan",
        "key": "fan-01",
        "name": "Fan 01",
        "status": "ERROR",
        "parent_key": "unit-2",
        "properties": {"rpm": 1480, "bearing": {"temperature": 72}},
    },
    {
        "type_key": "location",
        "key": "leipzig",
        "name": "Leipzig",
        "status": "ERROR",
        "parent_key": None,
        "properties": {"workflow": "Map entry point."},
    },
    {
        "type_key": "location",
        "key": "munich",
        "name": "Munich",
        "status": "NORMAL",
        "parent_key": None,
        "properties": {"workflow": "Map entry point."},
    },
    {
        "type_key": "location",
        "key": "hamburg",
        "name": "Hamburg",
        "status": "UNKNOWN",
        "parent_key": None,
        "properties": {"workflow": "Technical status-data issue."},
    },
]

DEMO_SPATIAL_POINTS = {
    "dresden": {"longitude": 13.7373, "latitude": 51.0504, "source": "demo-wgs84"},
    "leipzig": {"longitude": 12.3731, "latitude": 51.3397, "source": "demo-wgs84"},
    "munich": {"longitude": 11.5820, "latitude": 48.1351, "source": "demo-wgs84"},
    "hamburg": {"longitude": 9.9937, "latitude": 53.5511, "source": "demo-wgs84"},
}

DEMO_STORAGE_PLANT_SCHEMATIC = {
    "name": "Storage facility schematic",
    "configuration": {
        "drawio": {
            "enabled": True,
            "mode": "self-hosted",
            "editor_url": "http://localhost:8081",
        },
        "canvas": {"width": 860, "height": 300},
    },
    "elements": {
        "unit-2": {
            "x": 160,
            "y": 92,
            "width": 250,
            "height": 116,
            "shape": "unit",
        },
        "fan-01": {
            "x": 520,
            "y": 92,
            "width": 230,
            "height": 116,
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
        await session.execute(
            text(
                """
                DELETE FROM object_spatial
                WHERE object_id IN (
                    SELECT id FROM objects WHERE tenant_id = :tenant_id
                )
                """
            ),
            {"tenant_id": DEMO_TENANT_ID},
        )
        await session.execute(
            text(
                """
                DELETE FROM view_elements
                WHERE view_id IN (
                    SELECT views.id
                    FROM views
                    JOIN objects ON objects.id = views.object_id
                    WHERE objects.tenant_id = :tenant_id
                )
                """
            ),
            {"tenant_id": DEMO_TENANT_ID},
        )
        await session.execute(
            text(
                """
                DELETE FROM view_elements
                WHERE object_id IN (
                    SELECT id FROM objects WHERE tenant_id = :tenant_id
                )
                """
            ),
            {"tenant_id": DEMO_TENANT_ID},
        )
        await session.execute(
            text(
                """
                DELETE FROM views
                WHERE object_id IN (
                    SELECT id FROM objects WHERE tenant_id = :tenant_id
                )
                """
            ),
            {"tenant_id": DEMO_TENANT_ID},
        )
        await session.execute(
            text("UPDATE objects SET parent_id = NULL WHERE tenant_id = :tenant_id"),
            {"tenant_id": DEMO_TENANT_ID},
        )
        await session.execute(text("DELETE FROM objects WHERE tenant_id = :tenant_id"), {"tenant_id": DEMO_TENANT_ID})
        await session.flush()

        seeded_objects: dict[str, Object] = {}

        for demo_object in DEMO_OBJECTS:
            object_type = await _get_or_create_object_type(
                session,
                key=demo_object["type_key"],
                name=demo_object["type_key"].replace("-", " ").title(),
            )

            parent_key = demo_object["parent_key"]
            parent_id = seeded_objects[parent_key].id if parent_key else None
            object_item = Object(
                tenant_id=DEMO_TENANT_ID,
                object_type_id=object_type.id,
                parent_id=parent_id,
                key=demo_object["key"],
                name=demo_object["name"],
                properties=demo_object["properties"],
                status=demo_object["status"],
            )
            session.add(object_item)
            await session.flush()
            seeded_objects[demo_object["key"]] = object_item

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

        storage_plant = seeded_objects["storage-facility"]
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
