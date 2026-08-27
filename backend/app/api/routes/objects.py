from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.object import ObjectCreate, ObjectMove, ObjectRead, ObjectTreeNode, ObjectUpdate
from app.services import objects

router = APIRouter(prefix="/objects", tags=["objects"])


@router.post("", response_model=ObjectRead, status_code=status.HTTP_201_CREATED)
async def create_object(
    payload: ObjectCreate,
    session: AsyncSession = Depends(get_session),
):
    return await objects.create_object(session, payload)


@router.get("", response_model=list[ObjectRead])
async def list_objects(
    tenant_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await objects.list_objects(session, tenant_id=tenant_id)


@router.get("/tree", response_model=list[ObjectTreeNode])
async def get_object_tree(
    tenant_id: UUID | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_tree(session, tenant_id=tenant_id)


@router.get("/{object_id}", response_model=ObjectRead)
async def get_object(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_object(session, object_id)


@router.patch("/{object_id}", response_model=ObjectRead)
async def update_object(
    object_id: UUID,
    payload: ObjectUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await objects.update_object(session, object_id, payload)


@router.delete("/{object_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_object(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    await objects.delete_object(session, object_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{object_id}/children", response_model=list[ObjectRead])
async def get_children(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_children(session, object_id)


@router.get("/{object_id}/parent", response_model=ObjectRead | None)
async def get_parent(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_parent(session, object_id)


@router.get("/{object_id}/ancestors", response_model=list[ObjectRead])
async def get_ancestors(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_ancestors(session, object_id)


@router.get("/{object_id}/descendants", response_model=list[ObjectRead])
async def get_descendants(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await objects.get_descendants(session, object_id)


@router.post("/{object_id}/move", response_model=ObjectRead)
async def move_object(
    object_id: UUID,
    payload: ObjectMove,
    session: AsyncSession = Depends(get_session),
):
    return await objects.move_object(session, object_id, payload.parent_id)
