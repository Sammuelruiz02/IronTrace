"""baseline existing IronTrace schema

Revision ID: c5ef19dfeb91
Revises:
Create Date: 2026-08-09 23:43:25.761188

"""

from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = "c5ef19dfeb91"

down_revision: Union[
    str,
    Sequence[str],
    None,
] = None

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
    """
    Baseline migration.

    The IronTrace database schema already existed
    before Alembic was introduced.

    This migration intentionally makes no database
    changes. It establishes the starting point for
    future Alembic migrations.
    """

    pass


def downgrade() -> None:
    """
    No downgrade actions are required for the
    baseline migration.
    """

    pass