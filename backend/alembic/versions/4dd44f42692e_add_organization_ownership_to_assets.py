"""add organization ownership to assets

Revision ID: 4dd44f42692e
Revises: eceb9acee50d
Create Date: 2026-08-10 00:11:29.130066
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "4dd44f42692e"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "eceb9acee50d"

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
    # Add organization ownership to assets
    # --------------------------------------------------

    op.add_column(
        "assets",
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_assets_organization_id",
        "assets",
        ["organization_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_assets_organization_id",
        "assets",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # --------------------------------------------------
    # Backfill existing assets
    #
    # Every current asset already has an owner_id.
    # Each owner now belongs to an organization.
    #
    # Copy that organization onto the asset.
    # --------------------------------------------------

    op.execute(
        """
        UPDATE assets AS a
        SET organization_id = u.organization_id
        FROM users AS u
        WHERE a.owner_id = u.id
          AND a.organization_id IS NULL;
        """
    )

    # --------------------------------------------------
    # Organization-level asset number uniqueness
    #
    # Different companies may use the same asset number,
    # but one company cannot have duplicate asset numbers.
    # --------------------------------------------------

    op.create_unique_constraint(
        "uq_assets_organization_asset_number",
        "assets",
        [
            "organization_id",
            "asset_number",
        ],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_assets_organization_asset_number",
        "assets",
        type_="unique",
    )

    op.drop_constraint(
        "fk_assets_organization_id",
        "assets",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_assets_organization_id",
        table_name="assets",
    )

    op.drop_column(
        "assets",
        "organization_id",
    )