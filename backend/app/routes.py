from datetime import datetime, timezone
import hashlib
import hmac
import secrets

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_database
from app.models import Asset
from app.schemas import (
    AssetCreate,
    AssetGpsUpdate,
    AssetResponse,
    AssetUpdate,
    TrackerGpsResponse,
    TrackerGpsUpdate,
    TrackerKeyResponse,
)
from app.user_models import User

router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


def hash_tracker_secret(secret: str) -> str:
    return hashlib.sha256(
        secret.encode("utf-8"),
    ).hexdigest()


def build_tracker_key() -> tuple[str, str, str]:
    key_id = secrets.token_hex(12)
    secret = secrets.token_urlsafe(32)
    tracker_key = f"irontrace_{key_id}.{secret}"

    return key_id, secret, tracker_key


def parse_tracker_key(
    tracker_key: str,
) -> tuple[str, str]:
    prefix = "irontrace_"

    if not tracker_key.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tracker API key.",
        )

    key_body = tracker_key[len(prefix):]

    try:
        key_id, secret = key_body.split(".", 1)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tracker API key.",
        ) from error

    if not key_id or not secret:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tracker API key.",
        )

    return key_id, secret


def get_owned_asset(
    asset_id: int,
    database: Session,
    current_user: User,
) -> Asset:
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

    return asset


@router.get(
    "/",
    response_model=list[AssetResponse],
)
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
            detail=(
                "An asset with this asset number "
                "already exists."
            ),
        )

    asset_values = asset_data.model_dump()
    asset_values["owner_id"] = current_user.id
    asset_values["asset_number"] = asset_number
    asset_values["asset_name"] = (
        asset_data.asset_name.strip()
    )

    asset = Asset(**asset_values)

    database.add(asset)
    database.commit()
    database.refresh(asset)

    return asset


@router.post(
    "/tracker/gps",
    response_model=TrackerGpsResponse,
)
def update_gps_with_tracker_key(
    gps_data: TrackerGpsUpdate,
    x_tracker_key: str = Header(
        alias="X-Tracker-Key",
        description=(
            "The tracker API key assigned "
            "to the asset."
        ),
    ),
    database: Session = Depends(get_database),
):
    key_id, secret = parse_tracker_key(
        x_tracker_key,
    )

    asset = (
        database.query(Asset)
        .filter(Asset.tracker_key_id == key_id)
        .first()
    )

    if not asset or not asset.tracker_key_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tracker API key.",
        )

    submitted_hash = hash_tracker_secret(
        secret,
    )

    key_is_valid = hmac.compare_digest(
        submitted_hash,
        asset.tracker_key_hash,
    )

    if not key_is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tracker API key.",
        )

    recorded_at = (
        gps_data.recorded_at
        or datetime.now(timezone.utc)
    )

    asset.latitude = gps_data.latitude
    asset.longitude = gps_data.longitude
    asset.gps_updated_at = recorded_at
    asset.gps_status = (
        gps_data.gps_status.strip() or "Live"
    )
    asset.last_seen = "Live now"

    database.commit()
    database.refresh(asset)

    return TrackerGpsResponse(
        asset_id=asset.id,
        asset_number=asset.asset_number,
        latitude=asset.latitude,
        longitude=asset.longitude,
        gps_updated_at=asset.gps_updated_at,
        gps_status=asset.gps_status,
    )


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    updates = asset_data.model_dump(
        exclude_unset=True,
    )

    if (
        "asset_number" in updates
        and updates["asset_number"] is not None
    ):
        new_asset_number = updates[
            "asset_number"
        ].strip()

        duplicate_asset = (
            database.query(Asset)
            .filter(
                Asset.owner_id == current_user.id,
                Asset.asset_number
                == new_asset_number,
                Asset.id != asset_id,
            )
            .first()
        )

        if duplicate_asset:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An asset with this asset number "
                    "already exists."
                ),
            )

        updates["asset_number"] = (
            new_asset_number
        )

    if (
        "asset_name" in updates
        and updates["asset_name"] is not None
    ):
        updates["asset_name"] = updates[
            "asset_name"
        ].strip()

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
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    recorded_at = (
        gps_data.recorded_at
        or datetime.now(timezone.utc)
    )

    asset.latitude = gps_data.latitude
    asset.longitude = gps_data.longitude
    asset.gps_updated_at = recorded_at
    asset.gps_status = (
        gps_data.gps_status.strip() or "Live"
    )
    asset.last_seen = "Live now"

    database.commit()
    database.refresh(asset)

    return asset


@router.post(
    "/{asset_id}/tracker-key",
    response_model=TrackerKeyResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_tracker_key(
    asset_id: int,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    key_id, secret, tracker_key = (
        build_tracker_key()
    )

    created_at = datetime.now(
        timezone.utc,
    )

    asset.tracker_key_id = key_id
    asset.tracker_key_hash = (
        hash_tracker_secret(secret)
    )
    asset.tracker_key_created_at = created_at

    database.commit()
    database.refresh(asset)

    return TrackerKeyResponse(
        asset_id=asset.id,
        asset_number=asset.asset_number,
        tracker_key=tracker_key,
        created_at=created_at,
    )


@router.delete(
    "/{asset_id}/tracker-key",
    status_code=status.HTTP_204_NO_CONTENT,
)
def disable_tracker_key(
    asset_id: int,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    if not asset.has_tracker_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "This asset does not have "
                "an active tracker key."
            ),
        )

    asset.tracker_key_id = None
    asset.tracker_key_hash = None
    asset.tracker_key_created_at = None
    asset.gps_status = "Unassigned"
    asset.last_seen = "Tracker disabled"

    database.commit()


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_asset(
    asset_id: int,
    database: Session = Depends(get_database),
    current_user: User = Depends(get_current_user),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    database.delete(asset)
    database.commit()