import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, Text, ForeignKey, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base, UUIDPrimaryKeyMixin


class SaleStatus(str, enum.Enum):
    active = "active"
    returned = "returned"


class Sale(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "sales"

    part_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parts.id", ondelete="RESTRICT"), nullable=False
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    price_kzt: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_kzt: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")
    returned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default="now()"
    )

    part: Mapped["Part"] = relationship("Part")  # type: ignore[name-defined]

    __table_args__ = (
        Index("sales_part_idx", "part_id"),
        Index("sales_status_idx", "status"),
        Index("sales_created_idx", "created_at"),
    )
