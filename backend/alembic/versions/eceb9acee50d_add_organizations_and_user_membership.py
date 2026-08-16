"""add organizations and user membership

Revision ID: eceb9acee50d
Revises: d251d93e96ec
Create Date: 2026-08-10 00:04:01.988749
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "eceb9acee50d"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = "d251d93e96ec"

branch_labels: Union[
    str,
    Sequence[str],
    None,
] = None

depends_on: Union[
    str,
    Sequence[str],
    None,
] = None


def upgrade() -> None:
    # --------------------------------------------------
    # Add organization membership fields to users
    # --------------------------------------------------

    op.add_column(
        "users",
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    # Add role with a temporary database default so
    # existing users receive a valid role immediately.
    op.add_column(
        "users",
        sa.Column(
            "role",
            sa.String(length=50),
            nullable=False,
            server_default="member",
        ),
    )

    op.create_index(
        "ix_users_organization_id",
        "users",
        ["organization_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_users_organization_id",
        "users",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # --------------------------------------------------
    # Convert existing company_name values into
    # organizations.
    #
    # The MD5 suffix prevents two different company
    # names from accidentally producing the same slug.
    # --------------------------------------------------

    op.execute(
        """
        INSERT INTO organizations (
            name,
            slug,
            is_active,
            created_at
        )
        SELECT DISTINCT
            company_name,
            LOWER(
                TRIM(
                    BOTH '-'
                    FROM REGEXP_REPLACE(
                        company_name,
                        '[^A-Za-z0-9]+',
                        '-',
                        'g'
                    )
                )
            )
            || '-'
            || SUBSTRING(
                MD5(company_name)
                FROM 1 FOR 8
            ),
            TRUE,
            NOW()
        FROM users
        WHERE company_name IS NOT NULL
          AND TRIM(company_name) <> ''
        ON CONFLICT (slug) DO NOTHING;
        """
    )

    # --------------------------------------------------
    # Attach each existing user to the organization
    # created from their existing company_name.
    # --------------------------------------------------

    op.execute(
        """
        UPDATE users AS u
        SET organization_id = o.id
        FROM organizations AS o
        WHERE o.name = u.company_name
          AND u.organization_id IS NULL;
        """
    )

    # --------------------------------------------------
    # Make the first existing user in each organization
    # the organization admin.
    # --------------------------------------------------

    op.execute(
        """
        UPDATE users
        SET role = 'admin'
        WHERE id IN (
            SELECT MIN(id)
            FROM users
            WHERE organization_id IS NOT NULL
            GROUP BY organization_id
        );
        """
    )

    # Remove temporary database default.
    #
    # New-user role behavior remains controlled by the
    # SQLAlchemy application model.
    op.alter_column(
        "users",
        "role",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_users_organization_id",
        "users",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_users_organization_id",
        table_name="users",
    )

    op.drop_column(
        "users",
        "role",
    )

    op.drop_column(
        "users",
        "organization_id",
    )

    # Organizations are intentionally not deleted here.
    #
    # Removing them automatically during a downgrade
    # could destroy organization data created after
    # this migration.