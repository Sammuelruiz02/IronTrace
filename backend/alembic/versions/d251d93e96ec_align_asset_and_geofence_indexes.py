"""align asset and geofence indexes

Revision ID: d251d93e96ec
Revises: c5ef19dfeb91
Create Date: 2026-08-09 23:51:45.997701

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "d251d93e96ec"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "c5ef19dfeb91"

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
    """
    Align IronTrace indexes with the current
    multi-user asset model.
    """

    # Remove the old globally-unique asset number index.
    #
    # Asset numbers are now unique per owner through:
    #
    # uq_assets_owner_asset_number
    # (owner_id, asset_number)
    op.drop_index(
        "ix_assets_asset_number",
        table_name="assets",
    )

    # Keep asset_number indexed for fast searching,
    # but it is no longer globally unique.
    op.create_index(
        "ix_assets_asset_number",
        "assets",
        ["asset_number"],
        unique=False,
    )

    # Improve owner-scoped asset queries.
    op.create_index(
        "ix_assets_owner_id",
        "assets",
        ["owner_id"],
        unique=False,
    )

    # Improve acknowledgement-user lookups.
    op.create_index(
        "ix_geofence_events_acknowledged_by_user_id",
        "geofence_events",
        ["acknowledged_by_user_id"],
        unique=False,
    )


def downgrade() -> None:
    """
    Reverse the index alignment.

    Note:
    Recreating the globally unique asset_number
    index requires all asset numbers to be globally
    unique at downgrade time.
    """

    op.drop_index(
        "ix_geofence_events_acknowledged_by_user_id",
        table_name="geofence_events",
    )

    op.drop_index(
        "ix_assets_owner_id",
        table_name="assets",
    )

    op.drop_index(
        "ix_assets_asset_number",
        table_name="assets",
    )

    op.create_index(
        "ix_assets_asset_number",
        "assets",
        ["asset_number"],
        unique=True,
    )