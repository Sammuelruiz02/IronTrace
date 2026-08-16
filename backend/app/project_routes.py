from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_database
from app.models import (
    Asset,
    Project,
)
from app.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.user_models import User


router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# ---------------------------------------------------------
# PERMISSION HELPERS
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


def get_organization_project(
    project_id: int,
    database: Session,
    current_user: User,
) -> Project:
    organization_id = require_organization(
        current_user
    )

    project = (
        database.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id
            == organization_id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found.",
        )

    return project


# ---------------------------------------------------------
# GET ALL PROJECTS
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/",
    response_model=list[
        ProjectResponse
    ],
)
def get_projects(
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
        database.query(Project)
        .filter(
            Project.organization_id
            == organization_id
        )
        .order_by(
            Project.name.asc(),
            Project.id.asc(),
        )
        .all()
    )


# ---------------------------------------------------------
# GET ONE PROJECT
#
# admin   = allowed
# manager = allowed
# member  = allowed
# ---------------------------------------------------------


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
)
def get_project(
    project_id: int,
    database: Session = Depends(
        get_database
    ),
    current_user: User = Depends(
        get_current_user
    ),
):
    return get_organization_project(
        project_id,
        database,
        current_user,
    )


# ---------------------------------------------------------
# CREATE PROJECT
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project_data: ProjectCreate,
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

    project_name = (
        project_data.name.strip()
    )

    existing_project = (
        database.query(Project)
        .filter(
            Project.organization_id
            == organization_id,
            Project.name
            == project_name,
        )
        .first()
    )

    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "A project with this name "
                "already exists."
            ),
        )

    project = Project(
        organization_id=organization_id,
        name=project_name,
        code=(
            project_data.code.strip()
            if project_data.code
            else None
        ),
        address=(
            project_data.address.strip()
            if project_data.address
            else None
        ),
        status=project_data.status.strip(),
        notes=project_data.notes.strip(),
    )

    database.add(project)
    database.commit()
    database.refresh(project)

    return project


# ---------------------------------------------------------
# UPDATE PROJECT
#
# admin   = allowed
# manager = allowed
# member  = denied
# ---------------------------------------------------------


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project_data: ProjectUpdate,
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

    project = get_organization_project(
        project_id,
        database,
        current_user,
    )

    updates = project_data.model_dump(
        exclude_unset=True
    )

    if (
        "name" in updates
        and updates["name"] is not None
    ):
        new_name = updates[
            "name"
        ].strip()

        duplicate_project = (
            database.query(Project)
            .filter(
                Project.organization_id
                == project.organization_id,
                Project.name == new_name,
                Project.id != project.id,
            )
            .first()
        )

        if duplicate_project:
            raise HTTPException(
                status_code=(
                    status.HTTP_409_CONFLICT
                ),
                detail=(
                    "A project with this name "
                    "already exists."
                ),
            )

        updates["name"] = new_name

    if (
        "code" in updates
        and updates["code"] is not None
    ):
        updates[
            "code"
        ] = updates[
            "code"
        ].strip()

    if (
        "address" in updates
        and updates["address"] is not None
    ):
        updates[
            "address"
        ] = updates[
            "address"
        ].strip()

    if (
        "status" in updates
        and updates["status"] is not None
    ):
        updates[
            "status"
        ] = updates[
            "status"
        ].strip()

    if (
        "notes" in updates
        and updates["notes"] is not None
    ):
        updates[
            "notes"
        ] = updates[
            "notes"
        ].strip()

    old_name = project.name

    for field, value in updates.items():
        setattr(
            project,
            field,
            value,
        )

    # Keep the temporary legacy asset.project
    # display name synchronized.
    if (
        "name" in updates
        and project.name != old_name
    ):
        (
            database.query(Asset)
            .filter(
                Asset.organization_id
                == project.organization_id,
                Asset.project_id
                == project.id,
            )
            .update(
                {
                    Asset.project:
                    project.name
                },
                synchronize_session=False,
            )
        )

    database.commit()
    database.refresh(project)

    return project


# ---------------------------------------------------------
# DELETE PROJECT
#
# admin only
#
# Assets are NOT deleted.
# They become unassigned instead.
# ---------------------------------------------------------


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: int,
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

    project = get_organization_project(
        project_id,
        database,
        current_user,
    )

    # Explicitly unassign assets first so the
    # legacy project string stays correct too.
    (
        database.query(Asset)
        .filter(
            Asset.organization_id
            == project.organization_id,
            Asset.project_id
            == project.id,
        )
        .update(
            {
                Asset.project_id: None,
                Asset.project: "Unassigned",
            },
            synchronize_session=False,
        )
    )

    database.delete(project)
    database.commit()