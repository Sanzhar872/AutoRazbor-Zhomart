import uuid
from sqlalchemy import select, func

from app.extensions import db
from app.models.favorite import Favorite
from app.models.part import Part, PartStatus
from app.utils.favorite_slots import get_favorite_slots
from app.errors import (
    NotFoundError, PartNotAvailableError, FavoriteSlotError, AlreadyFavoritedError
)
from app.services import audit_service


def add_to_favorites(user_id: uuid.UUID, part_id: uuid.UUID) -> Favorite:
    part = db.session.get(Part, part_id)
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    if part.status != PartStatus.active:
        raise PartNotAvailableError("Запчасть недоступна")

    max_slots = get_favorite_slots(part.stock)
    if max_slots == 0:
        raise FavoriteSlotError("Товар закончился на складе")

    current_count = db.session.execute(
        select(func.count()).select_from(Favorite).where(Favorite.part_id == part_id)
    ).scalar_one()

    if current_count >= max_slots:
        raise FavoriteSlotError(
            f"Все {max_slots} слотов избранного заняты. Попробуйте позже.",
            part_id=str(part_id),
        )

    existing = db.session.execute(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.part_id == part_id)
    ).scalar_one_or_none()
    if existing:
        raise AlreadyFavoritedError("Уже в избранном")

    fav = Favorite(user_id=user_id, part_id=part_id)
    db.session.add(fav)
    audit_service.log("favorite.add", "favorite", fav.id, actor_id=user_id)
    db.session.commit()
    return fav


def remove_from_favorites(user_id: uuid.UUID, part_id: uuid.UUID) -> None:
    fav = db.session.execute(
        select(Favorite).where(Favorite.user_id == user_id, Favorite.part_id == part_id)
    ).scalar_one_or_none()
    if not fav:
        raise NotFoundError("Не найдено в избранном")
    audit_service.log("favorite.remove", "favorite", fav.id, actor_id=user_id)
    db.session.delete(fav)
    db.session.commit()


def get_user_favorites(user_id: uuid.UUID) -> list[Favorite]:
    return list(
        db.session.execute(
            select(Favorite).where(Favorite.user_id == user_id).order_by(Favorite.created_at.desc())
        ).scalars()
    )


def build_favorite_meta(part: Part, user_id: uuid.UUID | None) -> dict:
    max_slots = get_favorite_slots(part.stock)
    used = db.session.execute(
        select(func.count()).select_from(Favorite).where(Favorite.part_id == part.id)
    ).scalar_one()
    available = max(0, max_slots - used)
    is_favorited = False
    if user_id:
        is_favorited = db.session.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.part_id == part.id)
        ).scalar_one_or_none() is not None
    return {
        "max_slots": max_slots,
        "used_slots": used,
        "available_slots": available,
        "is_favorited_by_me": is_favorited,
    }
