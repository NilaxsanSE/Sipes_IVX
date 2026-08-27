from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ObjectTypeBase(BaseModel):
    key: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class ObjectTypeCreate(ObjectTypeBase):
    schema_definition: dict = Field(default_factory=dict)


class ObjectTypeUpdate(BaseModel):
    key: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    schema_definition: dict | None = None


class ObjectTypeVersionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    object_type_id: UUID
    version: int
    schema_definition: dict
    created_at: datetime


class ObjectTypeRead(ObjectTypeBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime
