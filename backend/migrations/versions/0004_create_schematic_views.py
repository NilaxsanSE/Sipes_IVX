"""Create schematic views.

Revision ID: 0004_schematic_views
Revises: 0003_object_spatial
Create Date: 2026-08-29
"""

from typing import Sequence, Union

from alembic import op


revision: str = "0004_schematic_views"
down_revision: Union[str, None] = "0003_object_spatial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE views (
            id uuid PRIMARY KEY,
            object_id uuid NOT NULL REFERENCES objects(id) ON DELETE CASCADE,
            type varchar(40) NOT NULL,
            name varchar(255) NOT NULL,
            configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT uq_views_object_type UNIQUE (object_id, type),
            CONSTRAINT ck_views_supported_type CHECK (type IN ('SCHEMATIC'))
        )
        """
    )
    op.execute("CREATE INDEX ix_views_object_id ON views (object_id)")

    op.execute(
        """
        CREATE TABLE view_elements (
            id uuid PRIMARY KEY,
            view_id uuid NOT NULL REFERENCES views(id) ON DELETE CASCADE,
            object_id uuid NOT NULL REFERENCES objects(id) ON DELETE RESTRICT,
            element_key varchar(120) NOT NULL,
            layout jsonb NOT NULL DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT uq_view_elements_view_key UNIQUE (view_id, element_key)
        )
        """
    )
    op.execute("CREATE INDEX ix_view_elements_view_id ON view_elements (view_id)")
    op.execute("CREATE INDEX ix_view_elements_object_id ON view_elements (object_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_view_elements_object_id")
    op.execute("DROP INDEX IF EXISTS ix_view_elements_view_id")
    op.execute("DROP TABLE IF EXISTS view_elements")
    op.execute("DROP INDEX IF EXISTS ix_views_object_id")
    op.execute("DROP TABLE IF EXISTS views")
