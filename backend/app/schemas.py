from datetime import datetime

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
)


# ---------------------------------------------------------
# PROJECT / JOBSITE SCHEMAS
# ---------------------------------------------------------


class ProjectCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150,
    )

    code: str | None = Field(
        default=None,
        max_length=50,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    status: str = Field(
        default="Active",
        min_length=1,
        max_length=50,
    )

    notes: str = ""


class ProjectUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    code: str | None = Field(
        default=None,
        max_length=50,
    )

    address: str | None = Field(
        default=None,
        max_length=255,
    )

    status: str | None = Field(
        default=None,
        min_length=1,
        max_length=50,
    )

    notes: str | None = None


class ProjectResponse(BaseModel):
    id: int
    organization_id: int

    name: str
    code: str | None
    address: str | None

    status: str
    notes: str

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ---------------------------------------------------------
# ASSET SCHEMAS
# ---------------------------------------------------------


class AssetBase(BaseModel):
    asset_number: str
    asset_name: str

    category: str = "Equipment"

    # Legacy project display name.
    #
    # This stays temporarily while the frontend moves
    # to structured project_id relationships.
    project: str = "Unassigned"

    # Structured Project / Jobsite relationship.
    project_id: int | None = None

    status: str = "Online"
    gps_status: str = "Unassigned"

    assigned_to: str = "Unassigned"

    last_seen: str = (
        "No GPS assigned"
    )

    latitude: float | None = None
    longitude: float | None = None

    gps_updated_at: datetime | None = None

    geofence_enabled: bool = False

    geofence_latitude: float | None = None
    geofence_longitude: float | None = None

    geofence_radius_meters: (
        float | None
    ) = None

    notes: str = ""

    @model_validator(mode="after")
    def validate_geofence(self):
        if not self.geofence_enabled:
            return self

        if self.geofence_latitude is None:
            raise ValueError(
                "Geofence latitude is required "
                "when geofencing is enabled."
            )

        if self.geofence_longitude is None:
            raise ValueError(
                "Geofence longitude is required "
                "when geofencing is enabled."
            )

        if (
            self.geofence_radius_meters
            is None
        ):
            raise ValueError(
                "Geofence radius is required "
                "when geofencing is enabled."
            )

        if not (
            -90
            <= self.geofence_latitude
            <= 90
        ):
            raise ValueError(
                "Geofence latitude must be "
                "between -90 and 90."
            )

        if not (
            -180
            <= self.geofence_longitude
            <= 180
        ):
            raise ValueError(
                "Geofence longitude must be "
                "between -180 and 180."
            )

        if (
            self.geofence_radius_meters
            <= 0
        ):
            raise ValueError(
                "Geofence radius must be "
                "greater than 0 meters."
            )

        return self


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    asset_number: str | None = None
    asset_name: str | None = None

    category: str | None = None

    # Legacy project name.
    project: str | None = None

    # Structured Project / Jobsite.
    project_id: int | None = None

    status: str | None = None
    gps_status: str | None = None

    assigned_to: str | None = None
    last_seen: str | None = None

    latitude: float | None = None
    longitude: float | None = None

    gps_updated_at: datetime | None = None

    geofence_enabled: bool | None = None

    geofence_latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    geofence_longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    geofence_radius_meters: (
        float | None
    ) = Field(
        default=None,
        gt=0,
    )

    notes: str | None = None


# ---------------------------------------------------------
# GPS
# ---------------------------------------------------------


class AssetGpsUpdate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90,
        description=(
            "Latitude between -90 and 90."
        ),
    )

    longitude: float = Field(
        ge=-180,
        le=180,
        description=(
            "Longitude between -180 and 180."
        ),
    )

    recorded_at: datetime | None = Field(
        default=None,
        description=(
            "Time the GPS device recorded "
            "the location. The server uses "
            "the current time when omitted."
        ),
    )

    gps_status: str = Field(
        default="Live",
        min_length=1,
        max_length=50,
    )

    @model_validator(mode="after")
    def validate_coordinates(self):
        if (
            self.latitude == 0
            and self.longitude == 0
        ):
            raise ValueError(
                "Latitude and longitude "
                "cannot both be zero."
            )

        return self


# ---------------------------------------------------------
# TRACKER
# ---------------------------------------------------------


class TrackerKeyResponse(BaseModel):
    asset_id: int
    asset_number: str

    tracker_key: str

    created_at: datetime

    description: str = (
        "Store this key securely. "
        "It will only be shown once."
    )


class TrackerGpsUpdate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90,
    )

    longitude: float = Field(
        ge=-180,
        le=180,
    )

    recorded_at: datetime | None = None

    gps_status: str = Field(
        default="Live",
        min_length=1,
        max_length=50,
    )

    @model_validator(mode="after")
    def validate_coordinates(self):
        if (
            self.latitude == 0
            and self.longitude == 0
        ):
            raise ValueError(
                "Latitude and longitude "
                "cannot both be zero."
            )

        return self


class TrackerGpsResponse(BaseModel):
    asset_id: int
    asset_number: str

    latitude: float
    longitude: float

    gps_updated_at: datetime

    gps_status: str

    message: str = (
        "GPS location updated successfully."
    )


# ---------------------------------------------------------
# LOCATION HISTORY
# ---------------------------------------------------------


class AssetLocationResponse(BaseModel):
    id: int
    asset_id: int

    latitude: float
    longitude: float

    gps_status: str

    recorded_at: datetime
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ---------------------------------------------------------
# GEOFENCE EVENTS
# ---------------------------------------------------------


class GeofenceEventResponse(BaseModel):
    id: int
    asset_id: int

    event_type: str
    geofence_status: str

    latitude: float
    longitude: float

    distance_meters: float

    geofence_radius_meters: float

    recorded_at: datetime

    acknowledged: bool

    acknowledged_at: (
        datetime | None
    )

    acknowledged_by_user_id: (
        int | None
    )

    acknowledged_by_name: (
        str | None
    ) = None

    acknowledged_by_email: (
        str | None
    ) = None

    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ---------------------------------------------------------
# ASSET RESPONSE
# ---------------------------------------------------------


class AssetResponse(AssetBase):
    id: int

    created_at: datetime

    has_tracker_key: bool

    tracker_key_created_at: (
        datetime | None
    ) = None

    geofence_state: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )

    @classmethod
    def from_asset(
        cls,
        asset,
    ):
        return cls(
            id=asset.id,

            asset_number=(
                asset.asset_number
            ),

            asset_name=(
                asset.asset_name
            ),

            category=asset.category,

            project=asset.project,

            project_id=(
                asset.project_id
            ),

            status=asset.status,

            gps_status=(
                asset.gps_status
            ),

            assigned_to=(
                asset.assigned_to
            ),

            last_seen=(
                asset.last_seen
            ),

            latitude=asset.latitude,
            longitude=asset.longitude,

            gps_updated_at=(
                asset.gps_updated_at
            ),

            geofence_enabled=(
                asset.geofence_enabled
            ),

            geofence_latitude=(
                asset.geofence_latitude
            ),

            geofence_longitude=(
                asset.geofence_longitude
            ),

            geofence_radius_meters=(
                asset.geofence_radius_meters
            ),

            notes=asset.notes,

            created_at=(
                asset.created_at
            ),

            has_tracker_key=bool(
                asset.tracker_key_hash
            ),

            tracker_key_created_at=(
                asset.tracker_key_created_at
            ),

            geofence_state=(
                asset.geofence_state
            ),
        )