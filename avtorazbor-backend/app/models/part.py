import uuid
import enum
from sqlalchemy import (
    String, Integer, Numeric, Boolean, Text, ForeignKey,
    Index, Enum as SAEnum, CheckConstraint, PrimaryKeyConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR

from app.models.base import Base, TimestampMixin, SoftDeleteMixin, UUIDPrimaryKeyMixin


class PartCondition(str, enum.Enum):
    good = "good"
    fair = "fair"
    poor = "poor"


class PartStatus(str, enum.Enum):
    active = "active"
    sold_out = "sold_out"
    draft = "draft"
    archived = "archived"


class Part(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "parts"

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    oem_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sku: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    price_kzt: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    condition: Mapped[PartCondition] = mapped_column(
        SAEnum(PartCondition, name="part_condition"), nullable=False, default=PartCondition.good
    )
    status: Mapped[PartStatus] = mapped_column(
        SAEnum(PartStatus, name="part_status"), nullable=False, default=PartStatus.draft
    )
    weight_kg: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    search_vector: Mapped[object | None] = mapped_column(TSVECTOR, nullable=True)

    category: Mapped["Category"] = relationship("Category")  # type: ignore[name-defined]
    images: Mapped[list["PartImage"]] = relationship(
        "PartImage", back_populates="part", cascade="all, delete-orphan",
        order_by="PartImage.position"
    )
    car_generations: Mapped[list["CarGeneration"]] = relationship(  # type: ignore[name-defined]
        "CarGeneration", secondary="part_car_models"
    )
    favorites: Mapped[list["Favorite"]] = relationship(  # type: ignore[name-defined]
        "Favorite", back_populates="part", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("stock >= 0", name="ck_parts_stock_non_negative"),
        Index("parts_category_idx", "category_id"),
        Index("parts_status_idx", "status"),
        Index("parts_stock_idx", "stock"),
        Index("parts_search_idx", "search_vector", postgresql_using="gin"),
        Index("parts_oem_idx", "oem_number"),
    )


class PartCarModel(Base):
    __tablename__ = "part_car_models"

    part_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parts.id", ondelete="CASCADE"), nullable=False
    )
    generation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("car_generations.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (PrimaryKeyConstraint("part_id", "generation_id"),)


class PartImage(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "part_images"

    part_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("parts.id", ondelete="CASCADE"), nullable=False
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media_assets.id"), nullable=False
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[str] = mapped_column(nullable=False)

    part: Mapped[Part] = relationship("Part", back_populates="images")
    asset: Mapped["MediaAsset"] = relationship("MediaAsset")  # type: ignore[name-defined]

    __table_args__ = (Index("pi_part_idx", "part_id", "position"),)
