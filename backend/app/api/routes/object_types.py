from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.object_type import ObjectTypeCreate, ObjectTypeRead, ObjectTypeUpdate
from app.services import object_types

router = APIRouter(prefix="/object-types", tags=["object types"])


@router.post("", response_model=ObjectTypeRead, status_code=status.HTTP_201_CREATED)
async def create_object_type(
    payload: ObjectTypeCreate,
    session: AsyncSession = Depends(get_session),
):
    return await object_types.create_object_type(session, payload)


@router.get("", response_model=list[ObjectTypeRead])
async def list_object_types(session: AsyncSession = Depends(get_session)):
    return await object_types.list_object_types(session)


@router.get("/{object_type_id}", response_model=ObjectTypeRead)
async def get_object_type(
    object_type_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await object_types.get_object_type(session, object_type_id)


@router.patch("/{object_type_id}", response_model=ObjectTypeRead)
async def update_object_type(
    object_type_id: UUID,
    payload: ObjectTypeUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await object_types.update_object_type(session, object_type_id, payload)
