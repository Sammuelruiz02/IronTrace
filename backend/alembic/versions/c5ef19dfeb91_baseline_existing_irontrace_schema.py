"""baseline existing IronTrace schema

Revision ID: c5ef19dfeb91
Revises:
Create Date: 2026-08-09 23:43:25.761188
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c5ef19dfeb91"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = None

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
    # USERS
    # --------------------------------------------------

    op.create_table(
        "users",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "full_name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "company_name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "hashed_password",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_users_id",
        "users",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_users_email",
        "users",
        ["email"],
        unique=True,
    )

    # --------------------------------------------------
    # ASSETS
    # --------------------------------------------------

    op.create_table(
        "assets",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "owner_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "asset_number",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "asset_name",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "category",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "project",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "gps_status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "assigned_to",
            sa.String(length=150),
            nullable=False,
        ),
        sa.Column(
            "last_seen",
            sa.String(length=100),
            nullable=False,
        ),
        sa.Column(
            "latitude",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "longitude",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "gps_updated_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "tracker_key_id",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "tracker_key_hash",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "tracker_key_created_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "geofence_enabled",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "geofence_latitude",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "geofence_longitude",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "geofence_radius_meters",
            sa.Float(),
            nullable=True,
        ),
        sa.Column(
            "geofence_state",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "owner_id",
            "asset_number",
            name="uq_assets_owner_asset_number",
        ),
    )

    op.create_index(
        "ix_assets_id",
        "assets",
        ["id"],
        unique=False,
    )

    # This index is replaced by the next migration.
    op.create_index(
        "ix_assets_asset_number",
        "assets",
        ["asset_number"],
        unique=True,
    )

    op.create_index(
        "ix_assets_tracker_key_id",
        "assets",
        ["tracker_key_id"],
        unique=True,
    )

    # --------------------------------------------------
    # ASSET LOCATION HISTORY
    # --------------------------------------------------

    op.create_table(
        "asset_locations",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "asset_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "gps_status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["asset_id"],
            ["assets.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_asset_locations_asset_id",
        "asset_locations",
        ["asset_id"],
        unique=False,
    )

    op.create_index(
        "ix_asset_locations_recorded_at",
        "asset_locations",
        ["recorded_at"],
        unique=False,
    )

    # --------------------------------------------------
    # GEOFENCE EVENTS
    # --------------------------------------------------

    op.create_table(
        "geofence_events",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "asset_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "event_type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "geofence_status",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "latitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "longitude",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "distance_meters",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "geofence_radius_meters",
            sa.Float(),
            nullable=False,
        ),
        sa.Column(
            "recorded_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "acknowledged",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "acknowledged_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "acknowledged_by_user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["asset_id"],
            ["assets.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["acknowledged_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_geofence_events_id",
        "geofence_events",
        ["id"],
        unique=False,
    )

    op.create_index(
        "ix_geofence_events_asset_id",
        "geofence_events",
        ["asset_id"],
        unique=False,
    )

    op.create_index(
        "ix_geofence_events_recorded_at",
        "geofence_events",
        ["recorded_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_table("geofence_events")
    op.drop_table("asset_locations")
    op.drop_table("assets")
    op.drop_table("users")
