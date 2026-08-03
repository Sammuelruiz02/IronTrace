from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.auth_schemas import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.database import get_database
from app.user_models import User

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


def authenticate_user(
    email: str,
    password: str,
    database: Session,
) -> User:
    normalized_email = email.strip().lower()

    user = (
        database.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if not user or not verify_password(
        password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    return user


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserRegister,
    database: Session = Depends(get_database),
):
    normalized_email = user_data.email.strip().lower()

    existing_user = (
        database.query(User)
        .filter(User.email == normalized_email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=normalized_email,
        full_name=user_data.full_name.strip(),
        company_name=user_data.company_name.strip(),
        hashed_password=hash_password(user_data.password),
    )

    database.add(user)
    database.commit()
    database.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    login_data: UserLogin,
    database: Session = Depends(get_database),
):
    user = authenticate_user(
        login_data.email,
        login_data.password,
        database,
    )

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@router.post(
    "/token",
    response_model=TokenResponse,
)
def swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    database: Session = Depends(get_database),
):
    user = authenticate_user(
        form_data.username,
        form_data.password,
        database,
    )

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_authenticated_user(
    current_user: User = Depends(get_current_user),
):
    return current_user