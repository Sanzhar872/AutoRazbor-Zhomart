from sqlalchemy import String, SmallInteger, ForeignKey, Index, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CarMake(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "car_makes"

    name: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    models: Mapped[list["CarModel"]] = relationship(
        "CarModel", back_populates="make", cascade="all, delete-orphan"
    )


class CarModel(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "car_models"

    make_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("car_makes.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)

    make: Mapped[CarMake] = relationship("CarMake", back_populates="models")
    generations: Mapped[list["CarGeneration"]] = relationship(
        "CarGeneration", back_populates="model", cascade="all, delete-orphan"
    )

    __table_args__ = (UniqueConstraint("make_id", "name", name="uq_car_model_make_name"),)


class CarGeneration(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "car_generations"

    model_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("car_models.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(Text, nullable=False)
    year_from: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    year_to: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    model: Mapped[CarModel] = relationship("CarModel", back_populates="generations")
