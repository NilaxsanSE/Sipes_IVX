from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.spatial import GeoJsonFeatureCollection, SpatialObjectRead
from app.services import spatial

router = APIRouter(prefix="/spatial", tags=["spatial"])


@router.get("/object/{object_id}", response_model=SpatialObjectRead)
async def get_object_spatial(
    object_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    return await spatial.get_object_spatial(session, object_id)


@router.get("/geojson", response_model=GeoJsonFeatureCollection)
async def get_spatial_geojson(
    bbox: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    return await spatial.get_geojson(session, bbox=bbox)
