from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.object_type import ObjectType
from app.schemas.object import ObjectCreate
from app.services.objects import (
    create_object,
    get_ancestors,
    get_children,
    get_descendants,
    get_tree,
    move_object,
)

pytestmark = pytest.mark.asyncio


async def _create_object(
    session: AsyncSession,
    object_type: ObjectType,
    tenant_id,
    key: str,
    name: str,
    parent_id=None,
):
    return await create_object(
        session,
        ObjectCreate(
            tenant_id=tenant_id,
            object_type_id=object_type.id,
            parent_id=parent_id,
            key=key,
            name=name,
            properties={},
            status="NORMAL",
        ),
    )


async def test_root_object_creation(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()

    root = await _create_object(session, object_type, tenant_id, "root", "Root")

    assert root.parent_id is None
    assert root.tenant_id == tenant_id


async def test_unlimited_nested_hierarchy(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    parent = None

    for index in range(25):
        parent = await _create_object(
            session,
            object_type,
            tenant_id,
            f"node-{index}",
            f"Node {index}",
            parent_id=parent.id if parent else None,
        )

    ancestors = await get_ancestors(session, parent.id)

    assert len(ancestors) == 24
    assert ancestors[0].key == "node-0"


async def test_child_retrieval(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    root = await _create_object(session, object_type, tenant_id, "root", "Root")
    child = await _create_object(session, object_type, tenant_id, "child", "Child", root.id)

    children = await get_children(session, root.id)

    assert [item.id for item in children] == [child.id]


async def test_ancestor_retrieval(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    root = await _create_object(session, object_type, tenant_id, "root", "Root")
    child = await _create_object(session, object_type, tenant_id, "child", "Child", root.id)
    grandchild = await _create_object(session, object_type, tenant_id, "grandchild", "Grandchild", child.id)

    ancestors = await get_ancestors(session, grandchild.id)

    assert [item.id for item in ancestors] == [root.id, child.id]


async def test_descendants(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    root = await _create_object(session, object_type, tenant_id, "root", "Root")
    child = await _create_object(session, object_type, tenant_id, "child", "Child", root.id)
    grandchild = await _create_object(session, object_type, tenant_id, "grandchild", "Grandchild", child.id)

    descendants = await get_descendants(session, root.id)

    assert [item.id for item in descendants] == [child.id, grandchild.id]


async def test_moving_objects(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    root = await _create_object(session, object_type, tenant_id, "root", "Root")
    child = await _create_object(session, object_type, tenant_id, "child", "Child", root.id)

    moved = await move_object(session, child.id, None)
    tree = await get_tree(session, tenant_id=tenant_id)

    assert moved.parent_id is None
    assert {node.key for node in tree} == {"root", "child"}


async def test_cycle_prevention(session: AsyncSession, object_type: ObjectType):
    tenant_id = uuid4()
    root = await _create_object(session, object_type, tenant_id, "root", "Root")
    child = await _create_object(session, object_type, tenant_id, "child", "Child", root.id)
    grandchild = await _create_object(session, object_type, tenant_id, "grandchild", "Grandchild", child.id)

    with pytest.raises(HTTPException) as error:
        await move_object(session, root.id, grandchild.id)

    assert error.value.status_code == 400
    assert "circular" in error.value.detail


async def test_same_tenant_validation(session: AsyncSession, object_type: ObjectType):
    parent = await _create_object(session, object_type, uuid4(), "parent", "Parent")

    with pytest.raises(HTTPException) as error:
        await _create_object(session, object_type, uuid4(), "child", "Child", parent.id)

    assert error.value.status_code == 400
    assert "same tenant" in error.value.detail
