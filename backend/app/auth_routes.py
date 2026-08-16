import re
import secrets

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    OAuth2PasswordRequestForm,
)
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.auth_schemas import (
    TeamRoleUpdate,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.database import get_database
from app.user_models import (
    Organization,
    User,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ---------------------------------------------------------
# AUTHENTICATION HELPERS
# ---------------------------------------------------------


def authenticate_user(
    email: str,
    password: str,
    database: Session,
) -> User:
    normalized_email = (
        email.strip().lower()
    )

    user = (
        database.query(User)
        .filter(
            User.email
            == normalized_email
        )
        .first()
    )

    if (
        not user
        or not verify_password(
            password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Incorrect email or password."
            ),
        )

    if not user.is_active:
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "This account is inactive."
            ),
        )

    return user


# ---------------------------------------------------------
# ORGANIZATION HELPERS
# ---------------------------------------------------------


def create_organization_slug(
    company_name: str,
) -> str:
    """
    Convert a company name into a URL-safe slug.

    A random suffix prevents two unrelated companies
    with the same name from colliding.
    """

    base_slug = (
        company_name
        .strip()
        .lower()
    )

    base_slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        base_slug,
    )

    base_slug = (
        base_slug.strip("-")
    )

    if not base_slug:
        base_slug = "organization"

    suffix = secrets.token_hex(4)

    return (
        f"{base_slug}-{suffix}"
    )


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


def require_admin(
    current_user: User,
) -> None:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=(
                status.HTTP_403_FORBIDDEN
            ),
            detail=(
                "Administrator permission "
                "is required."
            ),
        )


# ---------------------------------------------------------
# REGISTER
# ---------------------------------------------------------


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserRegister,
    database: Session = Depends(
        get_database
    ),
):
    normalized_email = (
        user_data.email
        .strip()
        .lower()
    )

    full_name = (
        user_data.full_name.strip()
    )

    company_name = (
        user_data.company_name.strip()
    )

    existing_user = (
        database.query(User)
        .filter(
            User.email
            == normalized_email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    # -----------------------------------------------------
    # Every public signup creates a NEW organization.
    #
    # We deliberately do not join organizations based
    # only on matching company_name. Otherwise someone
    # could type another company's name and gain access
    # to its data.
    # -----------------------------------------------------

    organization = Organization(
        name=company_name,
        slug=create_organization_slug(
            company_name
        ),
        is_active=True,
    )

    database.add(organization)

    # Flush gives us organization.id without committing
    # the transaction yet.
    database.flush()

    # The person creating the organization becomes its
    # first administrator.
    user = User(
        email=normalized_email,
        full_name=full_name,
        company_name=company_name,
        organization_id=(
            organization.id
        ),
        role="admin",
        hashed_password=(
            hash_password(
                user_data.password
            )
        ),
        is_active=True,
    )

    database.add(user)

    database.commit()
    database.refresh(user)

    return TokenResponse(
        access_token=(
            create_access_token(
                user.id
            )
        ),
        user=user,
    )


# ---------------------------------------------------------
# JSON LOGIN
# ---------------------------------------------------------


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    login_data: UserLogin,
    database: Session = Depends(
        get_database
    ),
):
    user = authenticate_user(
        login_data.email,
        login_data.password,
        database,
    )

    return TokenResponse(
        access_token=(
            create_access_token(
                user.id
            )
        ),
        user=user,
    )


# ---------------------------------------------------------
# SWAGGER / OAUTH LOGIN
# ---------------------------------------------------------


@router.post(
    "/token",
    response_model=TokenResponse,
)
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    database: Session = Depends(
        get_database
    ),
):
    user = authenticate_user(
        form_data.username,
        form_data.password,
        database,
    )

    return TokenResponse(
        access_token=(
            create_access_token(
                user.id
            )
        ),
        user=user,
    )


# ---------------------------------------------------------
# CURRENT USER
# ---------------------------------------------------------


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_authenticated_user(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


# ---------------------------------------------------------
# TEAM MEMBERS
#
# admin only
# ---------------------------------------------------------


@router.get(
    "/team",
    response_model=list[
        UserResponse
    ],
)
def get_team_members(
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

    organization_id = (
        require_organization(
            current_user
        )
    )

    return (
        database.query(User)
        .filter(
            User.organization_id
            == organization_id
        )
        .order_by(
            User.full_name.asc(),
            User.id.asc(),
        )
        .all()
    )


# ---------------------------------------------------------
# CHANGE TEAM MEMBER ROLE
#
# admin only
# ---------------------------------------------------------


@router.patch(
    "/team/{user_id}/role",
    response_model=UserResponse,
)
def update_team_member_role(
    user_id: int,
    role_data: TeamRoleUpdate,
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

    organization_id = (
        require_organization(
            current_user
        )
    )

    target_user = (
        database.query(User)
        .filter(
            User.id == user_id,
            User.organization_id
            == organization_id,
        )
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail=(
                "Team member not found."
            ),
        )

    new_role = role_data.role

    # -----------------------------------------------------
    # Protect the organization from losing its last admin.
    # -----------------------------------------------------

    if (
        target_user.role == "admin"
        and new_role != "admin"
    ):
        admin_count = (
            database.query(User)
            .filter(
                User.organization_id
                == organization_id,
                User.role == "admin",
                User.is_active.is_(True),
            )
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "You cannot remove the "
                    "organization's last "
                    "administrator."
                ),
            )

    target_user.role = new_role

    database.commit()
    database.refresh(
        target_user
    )

    return target_user