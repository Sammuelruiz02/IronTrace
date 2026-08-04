from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_database
from app.models import Asset
from app.schemas import (
    AssetCreate,
    AssetGpsUpdate,
    AssetResponse,
    AssetUpdate,
)
from app.user_models import User

router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


@router.get("/", response_model=list[AssetResponse])
def get_assets(
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    return (
        database.query(Asset)
        .filter(Asset.owner_id == current_user.id)
        .order_by(Asset.id.desc())
        .all()
    )


@router.post(
    "/",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_asset(
    asset_data: AssetCreate,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset_number = asset_data.asset_number.strip()

    existing_asset = (
        database.query(Asset)
        .filter(
            Asset.owner_id == current_user.id,
            Asset.asset_number == asset_number,
        )
        .first()
    )

    if existing_asset:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An asset with this asset number already exists.",
        )

    asset_values = asset_data.model_dump()
    asset_values["owner_id"] = current_user.id
    asset_values["asset_number"] = asset_number
    asset_values["asset_name"] = asset_data.asset_name.strip()

    asset = Asset(**asset_values)

    database.add(asset)
    database.commit()
    database.refresh(asset)

    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = (
        database.query(Asset)
        .filter(
            Asset.id == asset_id,
            Asset.owner_id == current_user.id,
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found.",
        )

    updates = asset_data.model_dump(exclude_unset=True)

    if "asset_number" in updates and updates["asset_number"] is not None:
        new_asset_number = updates["asset_number"].strip()

        duplicate_asset = (
            database.query(Asset)
            .filter(
                Asset.owner_id == current_user.id,
                Asset.asset_number == new_asset_number,
                Asset.id != asset_id,
            )
            .first()
        )

        if duplicate_asset:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An asset with this asset number already exists.",
            )

        updates["asset_number"] = new_asset_number

    if "asset_name" in updates and updates["asset_name"] is not None:
        updates["asset_name"] = updates["asset_name"].strip()

    for field, value in updates.items():
        setattr(asset, field, value)

    database.commit()
    database.refresh(asset)

    return asset


@router.post(
    "/{asset_id}/gps",
    response_model=AssetResponse,
)
def update_asset_gps(
    asset_id: int,
    gps_data: AssetGpsUpdate,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = (
        database.query(Asset)
        .filter(
            Asset.id == asset_id,
            Asset.owner_id == current_user.id,
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found.",
        )

    recorded_at = gps_data.recorded_at or datetime.now(timezone.utc)

    asset.latitude = gps_data.latitude
    asset.longitude = gps_data.longitude
    asset.gps_updated_at = recorded_at
    asset.gps_status = gps_data.gps_status.strip() or "Live"
    asset.last_seen = "Live now"

    database.commit()
    database.refresh(asset)

    return asset


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_asset(
    asset_id: int,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = (
        database.query(Asset)
        .filter(
            Asset.id == asset_id,
            Asset.owner_id == current_user.id,
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found.",
        )

    database.delete(asset)
    database.commit()