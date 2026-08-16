from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


# ---------------------------------------------------------
# PROJECT / JOBSITE
# ---------------------------------------------------------


class Project(Base):
    __tablename__ = "projects"

    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "name",
            name="uq_projects_organization_name",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
    )

    address: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Active",
    )

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )


# ---------------------------------------------------------
# ASSET
# ---------------------------------------------------------


class Asset(Base):
    __tablename__ = "assets"

    __table_args__ = (
        # Legacy user-level uniqueness.
        #
        # We are keeping this temporarily while
        # transitioning completely to organization
        # ownership.
        UniqueConstraint(
            "owner_id",
            "asset_number",
            name="uq_assets_owner_asset_number",
        ),

        # Organization-level asset number uniqueness.
        UniqueConstraint(
            "organization_id",
            "asset_number",
            name="uq_assets_organization_asset_number",
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # -----------------------------------------------------
    # LEGACY USER OWNERSHIP
    # -----------------------------------------------------

    owner_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # -----------------------------------------------------
    # ORGANIZATION OWNERSHIP
    # -----------------------------------------------------

    organization_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    # -----------------------------------------------------
    # ASSET INFORMATION
    # -----------------------------------------------------

    asset_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    asset_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Equipment",
    )

    # -----------------------------------------------------
    # LEGACY PROJECT NAME
    # -----------------------------------------------------
    #
    # Keep this temporarily while we migrate existing
    # project strings into the projects table.

    project: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Unassigned",
    )

    # -----------------------------------------------------
    # STRUCTURED PROJECT / JOBSITE
    # -----------------------------------------------------

    project_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "projects.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Online",
    )

    gps_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Unassigned",
    )

    assigned_to: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Unassigned",
    )

    last_seen: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="No GPS assigned",
    )

    # -----------------------------------------------------
    # GPS
    # -----------------------------------------------------

    latitude: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    longitude: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    gps_updated_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # -----------------------------------------------------
    # TRACKER AUTHENTICATION
    # -----------------------------------------------------

    tracker_key_id: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
        unique=True,
        index=True,
    )

    tracker_key_hash: Mapped[
        str | None
    ] = mapped_column(
        String(255),
        nullable=True,
    )

    tracker_key_created_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # -----------------------------------------------------
    # GEOFENCE
    # -----------------------------------------------------

    geofence_enabled: Mapped[
        bool
    ] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    geofence_latitude: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    geofence_longitude: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    geofence_radius_meters: Mapped[
        float | None
    ] = mapped_column(
        Float,
        nullable=True,
    )

    geofence_state: Mapped[
        str | None
    ] = mapped_column(
        String(50),
        nullable=True,
    )

    # -----------------------------------------------------
    # NOTES / METADATA
    # -----------------------------------------------------

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )

    @property
    def has_tracker_key(self) -> bool:
        return bool(
            self.tracker_key_hash
        )


# ---------------------------------------------------------
# ASSET LOCATION HISTORY
# ---------------------------------------------------------


class AssetLocation(Base):
    __tablename__ = "asset_locations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey(
            "assets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    latitude: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    gps_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
        default="Live",
    )

    recorded_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )


# ---------------------------------------------------------
# GEOFENCE EVENT HISTORY
# ---------------------------------------------------------


class GeofenceEvent(Base):
    __tablename__ = "geofence_events"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    asset_id: Mapped[int] = mapped_column(
        ForeignKey(
            "assets.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    event_type: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
    )

    geofence_status: Mapped[
        str
    ] = mapped_column(
        String(50),
        nullable=False,
    )

    latitude: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    longitude: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    distance_meters: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    geofence_radius_meters: Mapped[
        float
    ] = mapped_column(
        Float,
        nullable=False,
    )

    recorded_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    acknowledged: Mapped[
        bool
    ] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    acknowledged_at: Mapped[
        datetime | None
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    acknowledged_by_user_id: Mapped[
        int | None
    ] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    created_at: Mapped[
        datetime
    ] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(
            timezone.utc
        ),
    )