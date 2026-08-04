from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AssetBase(BaseModel):
    asset_number: str
    asset_name: str
    category: str = "Equipment"
    project: str = "Unassigned"
    status: str = "Online"
    gps_status: str = "Unassigned"
    assigned_to: str = "Unassigned"
    last_seen: str = "No GPS assigned"
    latitude: float | None = None
    longitude: float | None = None
    gps_updated_at: datetime | None = None
    notes: str = ""


class AssetCreate(AssetBase):
    pass


class AssetUpdate(BaseModel):
    asset_number: str | None = None
    asset_name: str | None = None
    category: str | None = None
    project: str | None = None
    status: str | None = None
    gps_status: str | None = None
    assigned_to: str | None = None
    last_seen: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    gps_updated_at: datetime | None = None
    notes: str | None = None


class AssetGpsUpdate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90,
        description="Latitude between -90 and 90.",
    )

    longitude: float = Field(
        ge=-180,
        le=180,
        description="Longitude between -180 and 180.",
    )

    recorded_at: datetime | None = Field(
        default=None,
        description=(
            "Time the GPS device recorded the location. "
            "The server uses the current time when omitted."
        ),
    )

    gps_status: str = Field(
        default="Live",
        min_length=1,
        max_length=50,
    )

    @model_validator(mode="after")
    def validate_coordinates(self):
        if self.latitude == 0 and self.longitude == 0:
            raise ValueError(
                "Latitude and longitude cannot both be zero."
            )

        return self


class TrackerKeyResponse(BaseModel):
    asset_id: int
    asset_number: str
    tracker_key: str
    created_at: datetime

    description: str = (
        "Store this key securely. It will only be shown once."
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
        if self.latitude == 0 and self.longitude == 0:
            raise ValueError(
                "Latitude and longitude cannot both be zero."
            )

        return self


class TrackerGpsResponse(BaseModel):
    asset_id: int
    asset_number: str
    latitude: float
    longitude: float
    gps_updated_at: datetime
    gps_status: str
    message: str = "GPS location updated successfully."


class AssetResponse(AssetBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)