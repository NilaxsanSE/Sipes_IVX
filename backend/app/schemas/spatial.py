from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PointGeometry(BaseModel):
    type: Literal["Point"] = "Point"
    coordinates: tuple[float, float] = Field(description="[longitude, latitude]")


class SpatialObjectRead(BaseModel):
    id: UUID
    object_id: UUID
    geometry: PointGeometry
    altitude: float | None
    source: str | None
    created_at: datetime
    updated_at: datetime


class GeoJsonFeature(BaseModel):
    type: Literal["Feature"] = "Feature"
    geometry: PointGeometry
    properties: dict


class GeoJsonFeatureCollection(BaseModel):
    type: Literal["FeatureCollection"] = "FeatureCollection"
    features: list[GeoJsonFeature]
