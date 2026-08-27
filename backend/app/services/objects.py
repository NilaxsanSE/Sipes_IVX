from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.object import Object
from app.models.object_type import ObjectType
from app.schemas.object import ObjectCreate, ObjectTreeNode, ObjectUpdate
from app.services.errors import bad_request, conflict, not_found


async def _ensure_object_type(session: AsyncSession, object_type_id: UUID) -> None:
    if not await session.get(ObjectType, object_type_id):
        raise bad_request("Invalid object_type_id. Object type does not exist.")


async def _ensure_unique_key(
    session: AsyncSession,
    tenant_id: UUID,
    key: str,
    exclude_object_id: UUID | None = None,
) -> None:
    statement = select(Object).where(Object.tenant_id == tenant_id, Object.key == key)
    if exclude_object_id is not None:
        statement = statement.where(Object.id != exclude_object_id)
    if await session.scalar(statement):
        raise conflict(f"Object key '{key}' already exists for this tenant.")


async def get_object(session: AsyncSession, object_id: UUID) -> Object:
    object_item = await session.get(Object, object_id)
    if not object_item:
        raise not_found("Object not found.")
    return object_item


async def _validate_parent(
    session: AsyncSession,
    tenant_id: UUID,
    parent_id: UUID | None,
) -> Object | None:
    if parent_id is None:
        return None

    parent = await session.get(Object, parent_id)
    if not parent:
        raise bad_request("Invalid parent_id. Parent object does not exist.")
    if parent.tenant_id != tenant_id:
        raise bad_request("Parent object must belong to the same tenant.")
    return parent


async def create_object(session: AsyncSession, payload: ObjectCreate) -> Object:
    await _ensure_object_type(session, payload.object_type_id)
    await _ensure_unique_key(session, payload.tenant_id, payload.key)
    await _validate_parent(session, payload.tenant_id, payload.parent_id)

    object_item = Object(**payload.model_dump())
    session.add(object_item)
    await session.commit()
    await session.refresh(object_item)
    return object_item


async def list_objects(session: AsyncSession, tenant_id: UUID | None = None) -> list[Object]:
    statement = select(Object).order_by(Object.created_at, Object.name)
    if tenant_id is not None:
        statement = statement.where(Object.tenant_id == tenant_id)

    result = await session.scalars(statement)
    return list(result)


async def update_object(session: AsyncSession, object_id: UUID, payload: ObjectUpdate) -> Object:
    object_item = await get_object(session, object_id)

    if payload.object_type_id is not None:
        await _ensure_object_type(session, payload.object_type_id)
        object_item.object_type_id = payload.object_type_id
    if payload.key is not None and payload.key != object_item.key:
        await _ensure_unique_key(session, object_item.tenant_id, payload.key, exclude_object_id=object_id)
        object_item.key = payload.key
    if payload.name is not None:
        object_item.name = payload.name
    if payload.properties is not None:
        object_item.properties = payload.properties
    if payload.status is not None:
        object_item.status = payload.status

    await session.commit()
    await session.refresh(object_item)
    return object_item


async def delete_object(session: AsyncSession, object_id: UUID) -> None:
    object_item = await get_object(session, object_id)
    children = await get_children(session, object_id)
    if children:
        raise conflict("Cannot delete an object that has children. Move or delete children first.")

    await session.delete(object_item)
    await session.commit()


async def get_children(session: AsyncSession, object_id: UUID) -> list[Object]:
    await get_object(session, object_id)
    result = await session.scalars(
        select(Object).where(Object.parent_id == object_id).order_by(Object.created_at, Object.name)
    )
    return list(result)


async def get_parent(session: AsyncSession, object_id: UUID) -> Object | None:
    object_item = await get_object(session, object_id)
    if object_item.parent_id is None:
        return None
    return await get_object(session, object_item.parent_id)


async def get_ancestors(session: AsyncSession, object_id: UUID) -> list[Object]:
    object_item = await get_object(session, object_id)
    ancestors: list[Object] = []
    parent_id = object_item.parent_id

    while parent_id is not None:
        parent = await get_object(session, parent_id)
        ancestors.append(parent)
        parent_id = parent.parent_id

    ancestors.reverse()
    return ancestors


async def get_descendants(session: AsyncSession, object_id: UUID) -> list[Object]:
    await get_object(session, object_id)
    descendants: list[Object] = []
    frontier = [object_id]

    while frontier:
        current_id = frontier.pop(0)
        result = await session.scalars(
            select(Object).where(Object.parent_id == current_id).order_by(Object.created_at, Object.name)
        )
        children = list(result)
        descendants.extend(children)
        frontier.extend(child.id for child in children)

    return descendants


async def move_object(session: AsyncSession, object_id: UUID, new_parent_id: UUID | None) -> Object:
    object_item = await get_object(session, object_id)

    if new_parent_id == object_id:
        raise bad_request("An object cannot become its own parent.")

    new_parent = await _validate_parent(session, object_item.tenant_id, new_parent_id)
    ancestor = new_parent
    while ancestor is not None:
        if ancestor.id == object_item.id:
            raise bad_request("Move would create a circular hierarchy.")
        ancestor = await get_parent(session, ancestor.id)

    object_item.parent_id = new_parent_id
    await session.commit()
    await session.refresh(object_item)
    return object_item


async def get_tree(session: AsyncSession, tenant_id: UUID | None = None) -> list[ObjectTreeNode]:
    objects = await list_objects(session, tenant_id=tenant_id)
    nodes = {
        object_item.id: ObjectTreeNode(
            id=object_item.id,
            tenant_id=object_item.tenant_id,
            object_type_id=object_item.object_type_id,
            parent_id=object_item.parent_id,
            key=object_item.key,
            name=object_item.name,
            properties=object_item.properties,
            status=object_item.status,
            created_at=object_item.created_at,
            updated_at=object_item.updated_at,
            children=[],
        )
        for object_item in objects
    }

    roots: list[ObjectTreeNode] = []
    for object_item in objects:
        node = nodes[object_item.id]
        if object_item.parent_id is None or object_item.parent_id not in nodes:
            roots.append(node)
        else:
            nodes[object_item.parent_id].children.append(node)

    return roots
