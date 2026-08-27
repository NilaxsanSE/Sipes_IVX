from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

ObjectStatus = Literal["NORMAL", "WARNING", "ERROR", "UNKNOWN"]


class ObjectBase(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=255)
    properties: dict = Field(default_factory=dict)
    status: ObjectStatus = "UNKNOWN"


class ObjectCreate(ObjectBase):
    tenant_id: UUID
    object_type_id: UUID
    parent_id: UUID | None = None


class ObjectUpdate(BaseModel):
    object_type_id: UUID | None = None
    key: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    properties: dict | None = None
    status: ObjectStatus | None = None


class ObjectMove(BaseModel):
    parent_id: UUID | None = None


class ObjectRead(ObjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    object_type_id: UUID
    parent_id: UUID | None
    created_at: datetime
    updated_at: datetime


class ObjectTreeNode(ObjectRead):
    children: list["ObjectTreeNode"] = Field(default_factory=list)
