from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.object_type import ObjectType, ObjectTypeVersion
from app.schemas.object_type import ObjectTypeCreate, ObjectTypeUpdate
from app.services.errors import conflict, not_found


async def create_object_type(session: AsyncSession, payload: ObjectTypeCreate) -> ObjectType:
    existing = await session.scalar(select(ObjectType).where(ObjectType.key == payload.key))
    if existing:
        raise conflict(f"Object type key '{payload.key}' already exists.")

    object_type = ObjectType(
        key=payload.key,
        name=payload.name,
        description=payload.description,
    )
    session.add(object_type)
    await session.flush()

    session.add(
        ObjectTypeVersion(
            object_type_id=object_type.id,
            version=1,
            schema_definition=payload.schema_definition,
        )
    )
    await session.commit()
    await session.refresh(object_type)
    return object_type


async def list_object_types(session: AsyncSession) -> list[ObjectType]:
    result = await session.scalars(select(ObjectType).order_by(ObjectType.key))
    return list(result)


async def get_object_type(session: AsyncSession, object_type_id: UUID) -> ObjectType:
    object_type = await session.get(ObjectType, object_type_id)
    if not object_type:
        raise not_found("Object type not found.")
    return object_type


async def update_object_type(
    session: AsyncSession,
    object_type_id: UUID,
    payload: ObjectTypeUpdate,
) -> ObjectType:
    object_type = await get_object_type(session, object_type_id)

    if payload.key is not None and payload.key != object_type.key:
        existing = await session.scalar(select(ObjectType).where(ObjectType.key == payload.key))
        if existing:
            raise conflict(f"Object type key '{payload.key}' already exists.")
        object_type.key = payload.key

    if payload.name is not None:
        object_type.name = payload.name
    if "description" in payload.model_fields_set:
        object_type.description = payload.description

    if payload.schema_definition is not None:
        latest_version = await session.scalar(
            select(func.max(ObjectTypeVersion.version)).where(
                ObjectTypeVersion.object_type_id == object_type.id
            )
        )
        session.add(
            ObjectTypeVersion(
                object_type_id=object_type.id,
                version=(latest_version or 0) + 1,
                schema_definition=payload.schema_definition,
            )
        )

    await session.commit()
    await session.refresh(object_type)
    return object_type
