from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
)


class UserRegister(BaseModel):
    email: EmailStr

    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    company_name: str = Field(
        min_length=2,
        max_length=150,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    company_name: str

    organization_id: int | None

    role: Literal[
        "admin",
        "manager",
        "member",
    ]

    is_active: bool

    model_config = ConfigDict(
        from_attributes=True
    )


class TeamRoleUpdate(BaseModel):
    role: Literal[
        "admin",
        "manager",
        "member",
    ]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse