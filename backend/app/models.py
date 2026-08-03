from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    asset_number: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
    )

    asset_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    category: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Equipment",
    )

    project: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Unassigned",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Online",
    )

    gps_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Unassigned",
    )

    assigned_to: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Unassigned",
    )

    last_seen: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="No GPS assigned",
    )

    notes: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )