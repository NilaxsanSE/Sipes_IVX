import asyncio
from uuid import UUID

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.object import Object
from app.models.object_type import ObjectType, ObjectTypeVersion

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

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
