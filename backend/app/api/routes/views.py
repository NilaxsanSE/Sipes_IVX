from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.view import ViewElementLayoutUpdate, ViewElementRead, ViewRead, ViewSummary
from app.services import views

router = APIRouter(prefix="/views", tags=["views"])


@router.get("", response_model=list[ViewSummary])
async def list_views(
    object_id: UUID | None = None,
    type: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await views.list_views(session, object_id=object_id, view_type=type)


@router.get("/object/{object_id}", response_model=list[ViewSummary])
async def list_object_views(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await views.list_views(session, object_id=object_id)


@router.get("/object/{object_id}/schematic", response_model=ViewRead)
async def get_object_schematic(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await views.get_object_schematic(session, object_id)


@router.get("/{view_id}", response_model=ViewRead)
async def get_view(
    view_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await views.get_view(session, view_id)


@router.patch("/elements/{element_id}/layout", response_model=ViewElementRead)
async def update_element_layout(
    element_id: UUID,
    payload: ViewElementLayoutUpdate,
    session: AsyncSession = Depends(get_session),
):
    return await views.update_element_layout(session, element_id, payload)
