from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ViewType = Literal["SCHEMATIC"]


class ViewElementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    view_id: UUID
    object_id: UUID
    element_key: str
    layout: dict
    created_at: datetime
    updated_at: datetime


class ViewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    object_id: UUID
    type: ViewType
    name: str
    configuration: dict
    created_at: datetime
    updated_at: datetime
    elements: list[ViewElementRead] = Field(default_factory=list)


class ViewSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    object_id: UUID
    type: ViewType
    name: str
    created_at: datetime
    updated_at: datetime


class ViewElementLayoutUpdate(BaseModel):
    layout: dict = Field(default_factory=dict)
