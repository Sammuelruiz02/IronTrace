from datetime import datetime, timezone
import hashlib
import hmac
import math
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
from app.models import (
    Asset,
    AssetLocation,
    GeofenceEvent,
)
from app.schemas import (
    AssetCreate,
    AssetGpsUpdate,
    AssetLocationResponse,
    AssetResponse,
    AssetUpdate,
    GeofenceEventResponse,
    TrackerGpsResponse,
    TrackerGpsUpdate,
    TrackerKeyResponse,
)
from app.user_models import User


router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


# ---------------------------------------------------------
# TRACKER KEY HELPERS
# ---------------------------------------------------------


def hash_tracker_secret(
    secret: str,
) -> str:
    return hashlib.sha256(
        secret.encode("utf-8")
    ).hexdigest()


def build_tracker_key() -> tuple[str, str, str]:
    key_id = secrets.token_hex(12)
    secret = secrets.token_urlsafe(32)

    tracker_key = (
        f"irontrace_{key_id}.{secret}"
    )

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
        key_id, secret = key_body.split(
            ".",
            1,
        )
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


# ---------------------------------------------------------
# ASSET HELPERS
# ---------------------------------------------------------


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


# ---------------------------------------------------------
# GEOFENCE RESPONSE HELPERS
# ---------------------------------------------------------


def add_acknowledgement_user_details(
    database: Session,
    event: GeofenceEvent,
) -> GeofenceEvent:
    """
    Attach reviewer name/email to a geofence event
    for the API response.

    These are response-only values. They are not
    stored as duplicate columns in geofence_events.
    """

    event.acknowledged_by_name = None
    event.acknowledged_by_email = None

    if event.acknowledged_by_user_id is None:
        return event

    user = (
        database.query(User)
        .filter(
            User.id
            == event.acknowledged_by_user_id
        )
        .first()
    )

    if user:
        event.acknowledged_by_name = (
            user.full_name
        )

        event.acknowledged_by_email = (
            user.email
        )

    return event


def add_acknowledgement_user_details_to_list(
    database: Session,
    events: list[GeofenceEvent],
) -> list[GeofenceEvent]:
    """
    Add reviewer details to a list of events
    without running one database query per event.
    """

    user_ids = {
        event.acknowledged_by_user_id
        for event in events
        if event.acknowledged_by_user_id
        is not None
    }

    users_by_id: dict[int, User] = {}

    if user_ids:
        users = (
            database.query(User)
            .filter(
                User.id.in_(user_ids)
            )
            .all()
        )

        users_by_id = {
            user.id: user
            for user in users
        }

    for event in events:
        event.acknowledged_by_name = None
        event.acknowledged_by_email = None

        if (
            event.acknowledged_by_user_id
            is None
        ):
            continue

        user = users_by_id.get(
            event.acknowledged_by_user_id
        )

        if user:
            event.acknowledged_by_name = (
                user.full_name
            )

            event.acknowledged_by_email = (
                user.email
            )

    return events


# ---------------------------------------------------------
# GPS TIME HELPERS
# ---------------------------------------------------------


def normalize_recorded_at(
    recorded_at: datetime | None,
) -> datetime:
    if recorded_at is None:
        return datetime.now(
            timezone.utc
        )

    if recorded_at.tzinfo is None:
        return recorded_at.replace(
            tzinfo=timezone.utc
        )

    return recorded_at.astimezone(
        timezone.utc
    )


# ---------------------------------------------------------
# LOCATION HISTORY
# ---------------------------------------------------------


def save_asset_location(
    database: Session,
    asset: Asset,
    latitude: float,
    longitude: float,
    gps_status: str,
    recorded_at: datetime,
) -> None:
    location = AssetLocation(
        asset_id=asset.id,
        latitude=latitude,
        longitude=longitude,
        gps_status=gps_status,
        recorded_at=recorded_at,
    )

    database.add(location)


# ---------------------------------------------------------
# GEOFENCE CALCULATIONS
# ---------------------------------------------------------


def calculate_distance_meters(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float,
) -> float:
    earth_radius_meters = 6371000

    lat1 = math.radians(
        latitude_1
    )

    lon1 = math.radians(
        longitude_1
    )

    lat2 = math.radians(
        latitude_2
    )

    lon2 = math.radians(
        longitude_2
    )

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(
            delta_lat / 2
        ) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(
            delta_lon / 2
        ) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a),
    )

    return (
        earth_radius_meters * c
    )


def evaluate_geofence(
    asset: Asset,
    latitude: float,
    longitude: float,
) -> tuple[str, float | None]:
    if not asset.geofence_enabled:
        return "Unassigned", None

    if (
        asset.geofence_latitude is None
        or asset.geofence_longitude is None
        or asset.geofence_radius_meters is None
    ):
        return "Unassigned", None

    distance = (
        calculate_distance_meters(
            latitude,
            longitude,
            asset.geofence_latitude,
            asset.geofence_longitude,
        )
    )

    if (
        distance
        <= asset.geofence_radius_meters
    ):
        return "Inside", distance

    return "Outside", distance


# ---------------------------------------------------------
# GEOFENCE EVENTS
# ---------------------------------------------------------


def save_geofence_event(
    database: Session,
    asset: Asset,
    event_type: str,
    geofence_status: str,
    latitude: float,
    longitude: float,
    distance_meters: float,
    recorded_at: datetime,
) -> None:
    if (
        asset.geofence_radius_meters
        is None
    ):
        return

    event = GeofenceEvent(
        asset_id=asset.id,
        event_type=event_type,
        geofence_status=geofence_status,
        latitude=latitude,
        longitude=longitude,
        distance_meters=(
            distance_meters
        ),
        geofence_radius_meters=(
            asset.geofence_radius_meters
        ),
        recorded_at=recorded_at,
        acknowledged=False,
        acknowledged_at=None,
        acknowledged_by_user_id=None,
    )

    database.add(event)


def process_geofence_transition(
    database: Session,
    asset: Asset,
    latitude: float,
    longitude: float,
    recorded_at: datetime,
) -> tuple[str, float | None]:
    new_state, distance = (
        evaluate_geofence(
            asset,
            latitude,
            longitude,
        )
    )

    if new_state == "Unassigned":
        asset.geofence_state = None

        return (
            new_state,
            distance,
        )

    previous_state = (
        asset.geofence_state
    )

    # First reading establishes baseline.
    if previous_state not in (
        "Inside",
        "Outside",
    ):
        asset.geofence_state = (
            new_state
        )

        return (
            new_state,
            distance,
        )

    # No crossing occurred.
    if previous_state == new_state:
        return (
            new_state,
            distance,
        )

    if distance is None:
        return (
            new_state,
            distance,
        )

    if (
        previous_state == "Inside"
        and new_state == "Outside"
    ):
        save_geofence_event(
            database=database,
            asset=asset,
            event_type="Exited",
            geofence_status="Outside",
            latitude=latitude,
            longitude=longitude,
            distance_meters=distance,
            recorded_at=recorded_at,
        )

    elif (
        previous_state == "Outside"
        and new_state == "Inside"
    ):
        save_geofence_event(
            database=database,
            asset=asset,
            event_type="Entered",
            geofence_status="Inside",
            latitude=latitude,
            longitude=longitude,
            distance_meters=distance,
            recorded_at=recorded_at,
        )

    asset.geofence_state = (
        new_state
    )

    return (
        new_state,
        distance,
    )


# ---------------------------------------------------------
# UPDATE CURRENT ASSET LOCATION
# ---------------------------------------------------------


def update_latest_asset_location(
    database: Session,
    asset: Asset,
    latitude: float,
    longitude: float,
    gps_status: str,
    recorded_at: datetime,
) -> None:
    existing_time = (
        asset.gps_updated_at
    )

    if existing_time is not None:
        if existing_time.tzinfo is None:
            existing_time = (
                existing_time.replace(
                    tzinfo=timezone.utc
                )
            )

        # Old packets remain in history
        # but cannot change live state.
        if recorded_at < existing_time:
            return

    geofence_status, distance = (
        process_geofence_transition(
            database=database,
            asset=asset,
            latitude=latitude,
            longitude=longitude,
            recorded_at=recorded_at,
        )
    )

    asset.latitude = latitude
    asset.longitude = longitude

    asset.gps_updated_at = (
        recorded_at
    )

    asset.gps_status = (
        gps_status
    )

    if geofence_status == "Inside":
        asset.last_seen = (
            "Live now • Inside geofence"
        )

    elif geofence_status == "Outside":
        if distance is not None:
            asset.last_seen = (
                "Live now • Outside geofence "
                f"({distance:.0f} m from center)"
            )

        else:
            asset.last_seen = (
                "Live now • Outside geofence"
            )

    else:
        asset.last_seen = (
            "Live now"
        )


# ---------------------------------------------------------
# GET ASSETS
# ---------------------------------------------------------


@router.get(
    "/",
    response_model=list[
        AssetResponse
    ],
)
def get_assets(
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    return (
        database.query(Asset)
        .filter(
            Asset.owner_id
            == current_user.id
        )
        .order_by(
            Asset.id.desc()
        )
        .all()
    )


# ---------------------------------------------------------
# CREATE ASSET
# ---------------------------------------------------------


@router.post(
    "/",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_asset(
    asset_data: AssetCreate,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset_number = (
        asset_data.asset_number.strip()
    )

    existing_asset = (
        database.query(Asset)
        .filter(
            Asset.owner_id
            == current_user.id,
            Asset.asset_number
            == asset_number,
        )
        .first()
    )

    if existing_asset:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "An asset with this asset "
                "number already exists."
            ),
        )

    asset_values = (
        asset_data.model_dump()
    )

    asset_values[
        "owner_id"
    ] = current_user.id

    asset_values[
        "asset_number"
    ] = asset_number

    asset_values[
        "asset_name"
    ] = (
        asset_data.asset_name.strip()
    )

    asset = Asset(
        **asset_values
    )

    database.add(asset)
    database.commit()
    database.refresh(asset)

    return asset


# ---------------------------------------------------------
# GPS TRACKER DEVICE UPDATE
# ---------------------------------------------------------


@router.post(
    "/tracker/gps",
    response_model=TrackerGpsResponse,
)
def update_gps_with_tracker_key(
    gps_data: TrackerGpsUpdate,
    x_tracker_key: str = Header(
        alias="X-Tracker-Key",
        description=(
            "The tracker API key "
            "assigned to the asset."
        ),
    ),
    database: Session = Depends(
        get_database
    ),
):
    key_id, secret = (
        parse_tracker_key(
            x_tracker_key
        )
    )

    asset = (
        database.query(Asset)
        .filter(
            Asset.tracker_key_id
            == key_id
        )
        .first()
    )

    if (
        not asset
        or not asset.tracker_key_hash
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid tracker API key."
            ),
        )

    submitted_hash = (
        hash_tracker_secret(
            secret
        )
    )

    key_is_valid = (
        hmac.compare_digest(
            submitted_hash,
            asset.tracker_key_hash,
        )
    )

    if not key_is_valid:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid tracker API key."
            ),
        )

    recorded_at = (
        normalize_recorded_at(
            gps_data.recorded_at
        )
    )

    gps_status = (
        gps_data.gps_status.strip()
        or "Live"
    )

    save_asset_location(
        database=database,
        asset=asset,
        latitude=gps_data.latitude,
        longitude=gps_data.longitude,
        gps_status=gps_status,
        recorded_at=recorded_at,
    )

    update_latest_asset_location(
        database=database,
        asset=asset,
        latitude=gps_data.latitude,
        longitude=gps_data.longitude,
        gps_status=gps_status,
        recorded_at=recorded_at,
    )

    database.commit()
    database.refresh(asset)

    return TrackerGpsResponse(
        asset_id=asset.id,
        asset_number=(
            asset.asset_number
        ),
        latitude=asset.latitude,
        longitude=asset.longitude,
        gps_updated_at=(
            asset.gps_updated_at
        ),
        gps_status=(
            asset.gps_status
        ),
    )


# ---------------------------------------------------------
# LOCATION HISTORY
# ---------------------------------------------------------


@router.get(
    "/{asset_id}/locations",
    response_model=list[
        AssetLocationResponse
    ],
)
def get_asset_locations(
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    return (
        database.query(
            AssetLocation
        )
        .filter(
            AssetLocation.asset_id
            == asset.id
        )
        .order_by(
            AssetLocation.recorded_at.desc(),
            AssetLocation.id.desc(),
        )
        .all()
    )


# ---------------------------------------------------------
# GEOFENCE EVENT HISTORY
# ---------------------------------------------------------


@router.get(
    "/{asset_id}/geofence-events",
    response_model=list[
        GeofenceEventResponse
    ],
)
def get_geofence_events(
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    events = (
        database.query(
            GeofenceEvent
        )
        .filter(
            GeofenceEvent.asset_id
            == asset.id
        )
        .order_by(
            GeofenceEvent.recorded_at.desc(),
            GeofenceEvent.id.desc(),
        )
        .all()
    )

    return (
        add_acknowledgement_user_details_to_list(
            database,
            events,
        )
    )


# ---------------------------------------------------------
# ACKNOWLEDGE GEOFENCE BREACH
# ---------------------------------------------------------


@router.post(
    "/{asset_id}/geofence-events/{event_id}/acknowledge",
    response_model=GeofenceEventResponse,
)
def acknowledge_geofence_event(
    asset_id: int,
    event_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    event = (
        database.query(
            GeofenceEvent
        )
        .filter(
            GeofenceEvent.id
            == event_id,
            GeofenceEvent.asset_id
            == asset.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Geofence event not found."
            ),
        )

    if event.event_type != "Exited":
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "Only geofence breach "
                "(Exited) events can be "
                "acknowledged."
            ),
        )

    # If already acknowledged, keep the
    # original reviewer and timestamp.
    if event.acknowledged:
        return (
            add_acknowledgement_user_details(
                database,
                event,
            )
        )

    event.acknowledged = True

    event.acknowledged_at = (
        datetime.now(
            timezone.utc
        )
    )

    event.acknowledged_by_user_id = (
        current_user.id
    )

    database.commit()
    database.refresh(event)

    return (
        add_acknowledgement_user_details(
            database,
            event,
        )
    )


# ---------------------------------------------------------
# UPDATE ASSET
# ---------------------------------------------------------


@router.put(
    "/{asset_id}",
    response_model=AssetResponse,
)
def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    updates = (
        asset_data.model_dump(
            exclude_unset=True
        )
    )

    if (
        "asset_number" in updates
        and updates[
            "asset_number"
        ] is not None
    ):
        new_asset_number = (
            updates[
                "asset_number"
            ].strip()
        )

        duplicate_asset = (
            database.query(Asset)
            .filter(
                Asset.owner_id
                == current_user.id,
                Asset.asset_number
                == new_asset_number,
                Asset.id
                != asset_id,
            )
            .first()
        )

        if duplicate_asset:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "An asset with this "
                    "asset number already "
                    "exists."
                ),
            )

        updates[
            "asset_number"
        ] = new_asset_number

    if (
        "asset_name" in updates
        and updates[
            "asset_name"
        ] is not None
    ):
        updates[
            "asset_name"
        ] = (
            updates[
                "asset_name"
            ].strip()
        )

    geofence_fields = {
        "geofence_enabled",
        "geofence_latitude",
        "geofence_longitude",
        "geofence_radius_meters",
    }

    geofence_changed = any(
        field in updates
        for field in geofence_fields
    )

    new_geofence_enabled = (
        updates.get(
            "geofence_enabled",
            asset.geofence_enabled,
        )
    )

    new_geofence_latitude = (
        updates.get(
            "geofence_latitude",
            asset.geofence_latitude,
        )
    )

    new_geofence_longitude = (
        updates.get(
            "geofence_longitude",
            asset.geofence_longitude,
        )
    )

    new_geofence_radius = (
        updates.get(
            "geofence_radius_meters",
            asset.geofence_radius_meters,
        )
    )

    if new_geofence_enabled:
        if (
            new_geofence_latitude
            is None
            or new_geofence_longitude
            is None
            or new_geofence_radius
            is None
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "Latitude, longitude, "
                    "and radius are required "
                    "when geofencing is "
                    "enabled."
                ),
            )

        if (
            new_geofence_radius
            <= 0
        ):
            raise HTTPException(
                status_code=(
                    status.HTTP_422_UNPROCESSABLE_ENTITY
                ),
                detail=(
                    "Geofence radius must "
                    "be greater than 0."
                ),
            )

    for field, value in (
        updates.items()
    ):
        setattr(
            asset,
            field,
            value,
        )

    # Changing the boundary should not
    # create a false Entered/Exited event.
    if geofence_changed:
        asset.geofence_state = None

        if (
            asset.geofence_enabled
            and asset.latitude
            is not None
            and asset.longitude
            is not None
        ):
            new_state, _ = (
                evaluate_geofence(
                    asset,
                    asset.latitude,
                    asset.longitude,
                )
            )

            if new_state in (
                "Inside",
                "Outside",
            ):
                asset.geofence_state = (
                    new_state
                )

    if not asset.geofence_enabled:
        asset.geofence_state = None

    database.commit()
    database.refresh(asset)

    return asset


# ---------------------------------------------------------
# USER-AUTHENTICATED GPS UPDATE
# ---------------------------------------------------------


@router.post(
    "/{asset_id}/gps",
    response_model=AssetResponse,
)
def update_asset_gps(
    asset_id: int,
    gps_data: AssetGpsUpdate,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    recorded_at = (
        normalize_recorded_at(
            gps_data.recorded_at
        )
    )

    gps_status = (
        gps_data.gps_status.strip()
        or "Live"
    )

    save_asset_location(
        database=database,
        asset=asset,
        latitude=gps_data.latitude,
        longitude=gps_data.longitude,
        gps_status=gps_status,
        recorded_at=recorded_at,
    )

    update_latest_asset_location(
        database=database,
        asset=asset,
        latitude=gps_data.latitude,
        longitude=gps_data.longitude,
        gps_status=gps_status,
        recorded_at=recorded_at,
    )

    database.commit()
    database.refresh(asset)

    return asset


# ---------------------------------------------------------
# GENERATE / REPLACE TRACKER KEY
# ---------------------------------------------------------


@router.post(
    "/{asset_id}/tracker-key",
    response_model=TrackerKeyResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_tracker_key(
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    key_id, secret, tracker_key = (
        build_tracker_key()
    )

    created_at = (
        datetime.now(
            timezone.utc
        )
    )

    asset.tracker_key_id = (
        key_id
    )

    asset.tracker_key_hash = (
        hash_tracker_secret(
            secret
        )
    )

    asset.tracker_key_created_at = (
        created_at
    )

    database.commit()
    database.refresh(asset)

    return TrackerKeyResponse(
        asset_id=asset.id,
        asset_number=(
            asset.asset_number
        ),
        tracker_key=(
            tracker_key
        ),
        created_at=(
            created_at
        ),
    )


# ---------------------------------------------------------
# DISABLE TRACKER
# ---------------------------------------------------------


@router.delete(
    "/{asset_id}/tracker-key",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def disable_tracker_key(
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    if not asset.has_tracker_key:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "This asset does not "
                "have an active tracker "
                "key."
            ),
        )

    asset.tracker_key_id = None
    asset.tracker_key_hash = None

    asset.tracker_key_created_at = (
        None
    )

    asset.gps_status = (
        "Unassigned"
    )

    asset.last_seen = (
        "Tracker disabled"
    )

    database.commit()


# ---------------------------------------------------------
# DELETE ASSET
# ---------------------------------------------------------


@router.delete(
    "/{asset_id}",
    status_code=(
        status.HTTP_204_NO_CONTENT
    ),
)
def delete_asset(
    asset_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    asset = get_owned_asset(
        asset_id,
        database,
        current_user,
    )

    database.delete(asset)
    database.commit()