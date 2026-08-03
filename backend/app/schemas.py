from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AssetBase(BaseModel):
    asset_number: str
    asset_name: str
    category: str = "Equipment"
    project: str = "Unassigned"
    status: str = "Online"
    gps_status: str = "Unassigned"
    assigned_to: str = "Unassigned"
    last_seen: str = "No GPS assigned"
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
    notes: str | None = None


class AssetResponse(AssetBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)