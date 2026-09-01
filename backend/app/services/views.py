from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.object import Object
from app.models.view import View, ViewElement
from app.schemas.view import ViewElementLayoutUpdate
from app.services.errors import bad_request, not_found
from app.services.objects import get_object


SUPPORTED_VIEW_TYPES = {"SCHEMATIC"}


async def list_views(
    session: AsyncSession,
    object_id: UUID | None = None,
    view_type: str | None = None,
) -> list[View]:
    if view_type is not None and view_type not in SUPPORTED_VIEW_TYPES:
        raise bad_request("Unsupported view type.")

    statement = select(View).order_by(View.created_at, View.name)
    if object_id is not None:
        await get_object(session, object_id)
        statement = statement.where(View.object_id == object_id)
    if view_type is not None:
        statement = statement.where(View.type == view_type)

    result = await session.scalars(statement)
    return list(result)


async def get_view(session: AsyncSession, view_id: UUID) -> View:
    view = await session.scalar(
        select(View).options(selectinload(View.elements)).where(View.id == view_id)
    )
    if not view:
        raise not_found("View not found.")
    return view


async def get_object_schematic(session: AsyncSession, object_id: UUID) -> View:
    await get_object(session, object_id)
    view = await session.scalar(
        select(View)
        .options(selectinload(View.elements))
        .where(View.object_id == object_id, View.type == "SCHEMATIC")
    )
    if not view:
        raise not_found("Schematic view not found for this object.")
    return view


async def update_element_layout(
    session: AsyncSession,
    element_id: UUID,
    payload: ViewElementLayoutUpdate,
) -> ViewElement:
    element = await session.get(ViewElement, element_id)
    if not element:
        raise not_found("View element not found.")

    view = await session.get(View, element.view_id)
    referenced_object = await session.get(Object, element.object_id)
    owner_object = await session.get(Object, view.object_id) if view else None
    if not view or not referenced_object or not owner_object:
        raise bad_request("Invalid view element. The view or referenced object is missing.")
    if referenced_object.tenant_id != owner_object.tenant_id:
        raise bad_request("View element object must belong to the same tenant as the view owner.")

    element.layout = payload.layout
    await session.commit()
    await session.refresh(element)
    return element
