from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Object(Base):
    __tablename__ = "objects"

    id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(PostgresUUID(as_uuid=True), nullable=False, index=True)
    object_type_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("object_types.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("objects.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    properties: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="UNKNOWN")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    object_type = relationship("ObjectType")
    spatial: Mapped["ObjectSpatial | None"] = relationship(
        "ObjectSpatial",
        back_populates="object",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )
    parent: Mapped[Object | None] = relationship(
        "Object",
        remote_side=[id],
        back_populates="children",
    )
    children: Mapped[list[Object]] = relationship("Object", back_populates="parent")

    __table_args__ = (
        UniqueConstraint("tenant_id", "key", name="uq_objects_tenant_key"),
        CheckConstraint("id <> parent_id", name="ck_objects_not_own_parent"),
    )
