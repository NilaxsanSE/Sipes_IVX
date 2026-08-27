"""Create core object hierarchy tables.

Revision ID: 0002_object_hierarchy
Revises: 0001_enable_postgis
Create Date: 2026-08-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision: str = "0002_object_hierarchy"
down_revision: Union[str, None] = "0001_enable_postgis"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "object_types",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index(op.f("ix_object_types_key"), "object_types", ["key"], unique=False)

    op.create_table(
        "object_type_versions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("object_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("schema_definition", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["object_type_id"], ["object_types.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("object_type_id", "version", name="uq_object_type_versions_type_version"),
    )
    op.create_index(
        op.f("ix_object_type_versions_object_type_id"),
        "object_type_versions",
        ["object_type_id"],
        unique=False,
    )

    op.create_table(
        "objects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("object_type_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("properties", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("id <> parent_id", name="ck_objects_not_own_parent"),
        sa.ForeignKeyConstraint(["object_type_id"], ["object_types.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["parent_id"], ["objects.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "key", name="uq_objects_tenant_key"),
    )
    op.create_index(op.f("ix_objects_object_type_id"), "objects", ["object_type_id"], unique=False)
    op.create_index(op.f("ix_objects_parent_id"), "objects", ["parent_id"], unique=False)
    op.create_index(op.f("ix_objects_tenant_id"), "objects", ["tenant_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_objects_tenant_id"), table_name="objects")
    op.drop_index(op.f("ix_objects_parent_id"), table_name="objects")
    op.drop_index(op.f("ix_objects_object_type_id"), table_name="objects")
    op.drop_table("objects")
    op.drop_index(op.f("ix_object_type_versions_object_type_id"), table_name="object_type_versions")
    op.drop_table("object_type_versions")
    op.drop_index(op.f("ix_object_types_key"), table_name="object_types")
    op.drop_table("object_types")
