"""Create object spatial table.

Revision ID: 0003_object_spatial
Revises: 0002_object_hierarchy
Create Date: 2026-08-28
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0003_object_spatial"
down_revision: Union[str, None] = "0002_object_hierarchy"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.execute(
        """
        CREATE TABLE object_spatial (
            id uuid PRIMARY KEY,
            object_id uuid NOT NULL UNIQUE REFERENCES objects(id) ON DELETE CASCADE,
            geometry geometry(Point, 4326) NOT NULL,
            altitude double precision NULL,
            source varchar(120) NULL,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX ix_object_spatial_object_id ON object_spatial (object_id)")
    op.execute("CREATE INDEX ix_object_spatial_geometry ON object_spatial USING GIST (geometry)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_object_spatial_geometry")
    op.execute("DROP INDEX IF EXISTS ix_object_spatial_object_id")
    op.execute("DROP TABLE IF EXISTS object_spatial")
