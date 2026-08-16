"""add projects and asset project ownership

Revision ID: 8f0a93cdfbc0
Revises: 4dd44f42692e
Create Date: 2026-08-16 10:34:42.031050
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "8f0a93cdfbc0"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "4dd44f42692e"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    # --------------------------------------------------
    # ADD STRUCTURED PROJECT REFERENCE TO ASSETS
    # --------------------------------------------------

    op.add_column(
        "assets",
        sa.Column(
            "project_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_assets_project_id",
        "assets",
        ["project_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_assets_project_id",
        "assets",
        "projects",
        ["project_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # --------------------------------------------------
    # MIGRATE EXISTING TEXT PROJECT NAMES
    #
    # Create one project per unique:
    #
    # organization_id + project name
    #
    # "Project Sparrow" in Organization 1 is therefore
    # separate from "Project Sparrow" in Organization 2.
    #
    # Assets marked "Unassigned" remain without a
    # structured project_id.
    # --------------------------------------------------

    op.execute(
        """
        INSERT INTO projects (
            organization_id,
            name,
            code,
            address,
            status,
            notes,
            created_at
        )
        SELECT DISTINCT
            a.organization_id,
            TRIM(a.project),
            NULL,
            NULL,
            'Active',
            '',
            NOW()
        FROM assets AS a
        WHERE a.organization_id IS NOT NULL
          AND a.project IS NOT NULL
          AND TRIM(a.project) <> ''
          AND LOWER(TRIM(a.project)) <> 'unassigned'
          AND NOT EXISTS (
              SELECT 1
              FROM projects AS p
              WHERE p.organization_id = a.organization_id
                AND p.name = TRIM(a.project)
          );
        """
    )

    # --------------------------------------------------
    # LINK EXISTING ASSETS TO THEIR NEW PROJECT RECORD
    # --------------------------------------------------

    op.execute(
        """
        UPDATE assets AS a
        SET project_id = p.id
        FROM projects AS p
        WHERE a.organization_id = p.organization_id
          AND p.name = TRIM(a.project)
          AND a.project_id IS NULL
          AND a.project IS NOT NULL
          AND TRIM(a.project) <> ''
          AND LOWER(TRIM(a.project)) <> 'unassigned';
        """
    )


def downgrade() -> None:
    # We intentionally keep project records during a
    # downgrade so project/jobsite information is not
    # destroyed.

    op.drop_constraint(
        "fk_assets_project_id",
        "assets",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_assets_project_id",
        table_name="assets",
    )

    op.drop_column(
        "assets",
        "project_id",
    )