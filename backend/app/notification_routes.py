from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_database
from app.models import Notification
from app.schemas import (
    NotificationResponse,
    NotificationUnreadCountResponse,
)
from app.user_models import User


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ---------------------------------------------------------
# ORGANIZATION / ROLE HELPERS
# ---------------------------------------------------------


def require_organization(
    current_user: User,
) -> int:
    if current_user.organization_id is None:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
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
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "You do not have permission "
                "to perform this action."
            ),
        )


def get_organization_notification(
    notification_id: int,
    database: Session,
    current_user: User,
) -> Notification:
    organization_id = require_organization(
        current_user
    )

    notification = (
        database.query(Notification)
        .filter(
            Notification.id
            == notification_id,
            Notification.organization_id
            == organization_id,
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="Notification not found.",
        )

    return notification


# ---------------------------------------------------------
# GET NOTIFICATIONS
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/",
    response_model=list[
        NotificationResponse
    ],
)
def get_notifications(
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
        database.query(Notification)
        .filter(
            Notification.organization_id
            == organization_id
        )
        .order_by(
            Notification.created_at.desc(),
            Notification.id.desc(),
        )
        .all()
    )


# ---------------------------------------------------------
# GET UNREAD COUNT
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/unread-count",
    response_model=(
        NotificationUnreadCountResponse
    ),
)
def get_unread_notification_count(
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

    unread_count = (
        database.query(Notification)
        .filter(
            Notification.organization_id
            == organization_id,
            Notification.is_read.is_(False),
        )
        .count()
    )

    return (
        NotificationUnreadCountResponse(
            unread_count=unread_count
        )
    )


# ---------------------------------------------------------
# MARK NOTIFICATION READ
#
# admin   = allowed
# manager = allowed
# member  = allowed
#
# Reading is not the same as resolving.
# ---------------------------------------------------------


@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
def mark_notification_read(
    notification_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    notification = (
        get_organization_notification(
            notification_id,
            database,
            current_user,
        )
    )

    # Idempotent:
    # preserve original reader and timestamp.
    if notification.is_read:
        return notification

    notification.is_read = True

    notification.read_at = (
        datetime.now(
            timezone.utc
        )
    )

    notification.read_by_user_id = (
        current_user.id
    )

    database.commit()
    database.refresh(notification)

    return notification


# ---------------------------------------------------------
# RESOLVE NOTIFICATION
#
# admin   = allowed
# manager = allowed
# member  = denied
#
# Resolving does not automatically change read state.
# The two states intentionally remain separate.
# ---------------------------------------------------------


@router.post(
    "/{notification_id}/resolve",
    response_model=NotificationResponse,
)
def resolve_notification(
    notification_id: int,
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

    notification = (
        get_organization_notification(
            notification_id,
            database,
            current_user,
        )
    )

    # Idempotent:
    # preserve original resolver and timestamp.
    if notification.is_resolved:
        return notification

    notification.is_resolved = True

    notification.resolved_at = (
        datetime.now(
            timezone.utc
        )
    )

    notification.resolved_by_user_id = (
        current_user.id
    )

    database.commit()
    database.refresh(notification)

    return notification