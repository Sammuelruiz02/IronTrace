from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_database
from app.models import (
    Asset,
    TrackerDevice,
)
from app.schemas import (
    TrackerDeviceCreate,
    TrackerDeviceResponse,
    TrackerDeviceUpdate,
)
from app.user_models import User


router = APIRouter(
    prefix="/devices",
    tags=["Tracker Devices"],
)


# ---------------------------------------------------------
# PERMISSION / ORGANIZATION HELPERS
# ---------------------------------------------------------


def require_organization(
    current_user: User,
) -> int:
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Your account is not assigned "
                "to an organization."
            ),
        )

    return current_user.organization_id


def require_manager_or_admin(
    current_user: User,
) -> None:
    if current_user.role not in {
        "admin",
        "manager",
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You do not have permission "
                "to perform this action."
            ),
        )


def require_admin(
    current_user: User,
) -> None:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Administrator permission "
                "is required."
            ),
        )


def get_organization_device(
    device_id: int,
    database: Session,
    current_user: User,
) -> TrackerDevice:
    organization_id = require_organization(
        current_user
    )

    device = (
        database.query(TrackerDevice)
        .filter(
            TrackerDevice.id == device_id,
            TrackerDevice.organization_id
            == organization_id,
        )
        .first()
    )

    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tracker device not found.",
        )

    return device


def get_organization_asset(
    asset_id: int,
    database: Session,
    current_user: User,
) -> Asset:
    organization_id = require_organization(
        current_user
    )

    asset = (
        database.query(Asset)
        .filter(
            Asset.id == asset_id,
            Asset.organization_id
            == organization_id,
        )
        .first()
    )

    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found.",
        )

    return asset


def commit_device_change(
    database: Session,
) -> None:
    try:
        database.commit()

    except IntegrityError as error:
        database.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This tracker conflicts with "
                "an existing device record. "
                "Check the serial number, IMEI, "
                "SIM ICCID, provider device ID, "
                "or asset assignment."
            ),
        ) from error


# ---------------------------------------------------------
# LIST DEVICES
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/",
    response_model=list[
        TrackerDeviceResponse
    ],
)
def get_devices(
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    organization_id = require_organization(
        current_user
    )

    return (
        database.query(TrackerDevice)
        .filter(
            TrackerDevice.organization_id
            == organization_id
        )
        .order_by(
            TrackerDevice.device_name.asc(),
            TrackerDevice.id.asc(),
        )
        .all()
    )


# ---------------------------------------------------------
# GET ONE DEVICE
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/{device_id}",
    response_model=TrackerDeviceResponse,
)
def get_device(
    device_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_organization_device(
        device_id,
        database,
        current_user,
    )


# ---------------------------------------------------------
# CREATE DEVICE
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.post(
    "/",
    response_model=TrackerDeviceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_device(
    device_data: TrackerDeviceCreate,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    require_manager_or_admin(
        current_user
    )

    organization_id = require_organization(
        current_user
    )

    device = TrackerDevice(
        organization_id=organization_id,

        asset_id=None,

        device_name=(
            device_data.device_name.strip()
        ),

        serial_number=(
            device_data.serial_number.strip()
        ),

        provider=(
            device_data.provider.strip()
        ),

        provider_device_id=(
            device_data.provider_device_id.strip()
            if device_data.provider_device_id
            else None
        ),

        imei=(
            device_data.imei.strip()
            if device_data.imei
            else None
        ),

        sim_iccid=(
            device_data.sim_iccid.strip()
            if device_data.sim_iccid
            else None
        ),

        status=(
            device_data.status.strip()
        ),

        notes=(
            device_data.notes.strip()
        ),
    )

    database.add(device)

    commit_device_change(
        database
    )

    database.refresh(device)

    return device


# ---------------------------------------------------------
# UPDATE DEVICE
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.put(
    "/{device_id}",
    response_model=TrackerDeviceResponse,
)
def update_device(
    device_id: int,
    device_data: TrackerDeviceUpdate,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    require_manager_or_admin(
        current_user
    )

    device = get_organization_device(
        device_id,
        database,
        current_user,
    )

    updates = device_data.model_dump(
        exclude_unset=True
    )

    string_fields = {
        "device_name",
        "serial_number",
        "provider",
        "provider_device_id",
        "imei",
        "sim_iccid",
        "status",
        "notes",
    }

    for field, value in updates.items():
        if (
            field in string_fields
            and value is not None
        ):
            value = value.strip()

        setattr(
            device,
            field,
            value,
        )

    commit_device_change(
        database
    )

    database.refresh(device)

    return device


# ---------------------------------------------------------
# ASSIGN DEVICE TO ASSET
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.post(
    "/{device_id}/assign/{asset_id}",
    response_model=TrackerDeviceResponse,
)
def assign_device(
    device_id: int,
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    require_manager_or_admin(
        current_user
    )

    device = get_organization_device(
        device_id,
        database,
        current_user,
    )

    asset = get_organization_asset(
        asset_id,
        database,
        current_user,
    )

    existing_assignment = (
        database.query(TrackerDevice)
        .filter(
            TrackerDevice.asset_id
            == asset.id,
            TrackerDevice.id
            != device.id,
        )
        .first()
    )

    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This asset already has "
                "another tracker device assigned."
            ),
        )

    device.asset_id = asset.id

    device.assigned_at = (
        datetime.now(
            timezone.utc
        )
    )

    if device.status == "Inactive":
        device.status = "Active"

    commit_device_change(
        database
    )

    database.refresh(device)

    return device


# ---------------------------------------------------------
# UNASSIGN DEVICE
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.post(
    "/{device_id}/unassign",
    response_model=TrackerDeviceResponse,
)
def unassign_device(
    device_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    require_manager_or_admin(
        current_user
    )

    device = get_organization_device(
        device_id,
        database,
        current_user,
    )

    device.asset_id = None
    device.assigned_at = None

    commit_device_change(
        database
    )

    database.refresh(device)

    return device


# ---------------------------------------------------------
# DELETE DEVICE
#
# admin only
#
# This deletes the device inventory record.
# It does NOT delete the asset.
# ---------------------------------------------------------


@router.delete(
    "/{device_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_device(
    device_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    require_admin(
        current_user
    )

    device = get_organization_device(
        device_id,
        database,
        current_user,
    )

    database.delete(device)

    commit_device_change(
        database
    )