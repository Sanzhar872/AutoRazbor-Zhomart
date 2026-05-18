import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base, UUIDPrimaryKeyMixin, utcnow


class Favorite(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "favorites"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    part_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parts.id", ondelete="CASCADE"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="favorites")  # type: ignore[name-defined]
    part: Mapped["Part"] = relationship("Part", back_populates="favorites")  # type: ignore[name-defined]

    __table_args__ = (
        UniqueConstraint("user_id", "part_id", name="uq_favorites_user_part"),
        Index("fav_user_idx", "user_id"),
        Index("fav_part_idx", "part_id"),
    )
