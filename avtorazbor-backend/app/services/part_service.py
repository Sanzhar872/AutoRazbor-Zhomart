import uuid
from datetime import datetime, timezone
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.extensions import db
from app.models.part import Part, PartStatus, PartCarModel, PartImage
from app.models.car import CarGeneration
from app.models.category import Category
from app.errors import NotFoundError, ValidationError
from app.services.slug_service import make_unique_slug
from app.utils.pagination import paginate, PaginationMeta


def get_parts(
    category_id: uuid.UUID | None = None,
    make_id: uuid.UUID | None = None,
    model_id: uuid.UUID | None = None,
    generation_id: uuid.UUID | None = None,
    status: str | None = "active",
    condition: str | None = None,
    price_min: float | None = None,
    price_max: float | None = None,
    oem: str | None = None,
    q: str | None = None,
    sort: str = "newest",
    priority: int | None = None,
    page: int = 1,
    per_page: int = 20,
) -> tuple[list[Part], PaginationMeta]:
    stmt = (
        select(Part)
        .where(Part.deleted_at.is_(None))
        .options(
            selectinload(Part.category),
            selectinload(Part.images),
        )
    )

    if status:
        stmt = stmt.where(Part.status == status)
    if category_id:
        stmt = stmt.where(Part.category_id == category_id)
    if condition:
        stmt = stmt.where(Part.condition == condition)
    if price_min is not None:
        stmt = stmt.where(Part.price_kzt >= price_min)
    if price_max is not None:
        stmt = stmt.where(Part.price_kzt <= price_max)
    if oem:
        stmt = stmt.where(Part.oem_number.ilike(f"%{oem}%"))
    if priority is not None:
        stmt = stmt.where(Part.priority == priority)
    if q:
        stmt = stmt.where(
            or_(
                Part.title.ilike(f"%{q}%"),
                Part.oem_number.ilike(f"%{q}%"),
                Part.description.ilike(f"%{q}%"),
            )
        )
    if generation_id:
        stmt = stmt.join(PartCarModel, PartCarModel.part_id == Part.id).where(
            PartCarModel.generation_id == generation_id
        )
    elif model_id:
        stmt = stmt.join(PartCarModel, PartCarModel.part_id == Part.id).join(
            CarGeneration, CarGeneration.id == PartCarModel.generation_id
        ).where(CarGeneration.model_id == model_id)
    elif make_id:
        from app.models.car import CarModel as CarModelM
        stmt = stmt.join(PartCarModel, PartCarModel.part_id == Part.id).join(
            CarGeneration, CarGeneration.id == PartCarModel.generation_id
        ).join(CarModelM, CarModelM.id == CarGeneration.model_id).where(
            CarModelM.make_id == make_id
        )

    if sort == "category":
        stmt = stmt.join(Category, Category.id == Part.category_id).order_by(
            Category.name.asc(), Part.created_at.desc()
        )
    elif sort == "price_asc":
        stmt = stmt.order_by(Part.priority.desc(), Part.price_kzt.asc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Part.priority.desc(), Part.price_kzt.desc())
    elif sort == "stock_desc":
        stmt = stmt.order_by(Part.priority.desc(), Part.stock.desc())
    else:
        stmt = stmt.order_by(Part.priority.desc(), Part.created_at.desc())

    total = db.session.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()

    per_page = min(per_page, 500)
    page = max(page, 1)
    items = list(db.session.execute(
        stmt.offset((page - 1) * per_page).limit(per_page)
    ).scalars())
    pages = (total + per_page - 1) // per_page if per_page else 0

    return items, PaginationMeta(total=total, page=page, per_page=per_page, pages=pages)


def get_part_by_slug(slug: str) -> Part:
    part = db.session.execute(
        select(Part)
        .where(Part.slug == slug, Part.deleted_at.is_(None))
        .options(
            selectinload(Part.category),
            selectinload(Part.images),
            selectinload(Part.car_generations),
        )
    ).scalar_one_or_none()
    if not part:
        raise NotFoundError("Запчасть не найдена")
    return part


def get_part_by_id(part_id: uuid.UUID) -> Part:
    part = db.session.get(Part, part_id)
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    return part


def _normalize(data: dict) -> dict:
    """Convert empty strings to None for nullable unique fields."""
    for field in ("sku", "oem_number", "description"):
        if field in data and data[field] == "":
            data[field] = None
    return data


def create_part(data: dict) -> Part:
    generation_ids = data.pop("generation_ids", [])
    _normalize(data)
    category = db.session.get(Category, data["category_id"])
    if not category:
        raise ValidationError("Категория не найдена")

    slug = make_unique_slug(data["title"], "parts")
    part = Part(slug=slug, **data)
    # Auto-correct status based on stock
    if part.stock == 0 and part.status == PartStatus.active:
        part.status = PartStatus.sold_out
    elif part.stock > 0 and part.status == PartStatus.sold_out:
        part.status = PartStatus.active
    db.session.add(part)
    db.session.flush()

    for gen_id in generation_ids:
        db.session.add(PartCarModel(part_id=part.id, generation_id=gen_id))

    db.session.commit()
    return part


def update_part(part_id: uuid.UUID, data: dict) -> Part:
    part = get_part_by_id(part_id)
    generation_ids = data.pop("generation_ids", None)
    _normalize(data)

    if "title" in data and data["title"] != part.title:
        data["slug"] = make_unique_slug(data["title"], "parts", existing_id=part.id)

    for key, value in data.items():
        setattr(part, key, value)

    # Auto-correct status based on stock
    if part.stock == 0 and part.status == PartStatus.active:
        part.status = PartStatus.sold_out
    elif part.stock > 0 and part.status == PartStatus.sold_out:
        part.status = PartStatus.active

    if generation_ids is not None:
        db.session.execute(
            select(PartCarModel).where(PartCarModel.part_id == part.id)
        )
        for pcm in db.session.execute(
            select(PartCarModel).where(PartCarModel.part_id == part.id)
        ).scalars():
            db.session.delete(pcm)
        for gen_id in generation_ids:
            db.session.add(PartCarModel(part_id=part.id, generation_id=gen_id))

    db.session.commit()
    return part


def soft_delete_part(part_id: uuid.UUID) -> None:
    from app.models.sale import Sale
    part = get_part_by_id(part_id)
    part.deleted_at = datetime.now(timezone.utc)
    part.status = PartStatus.archived
    # Удаляем все записи о продажах этого товара
    db.session.execute(
        db.select(Sale).where(Sale.part_id == part_id)
    )
    for sale in db.session.execute(db.select(Sale).where(Sale.part_id == part_id)).scalars():
        db.session.delete(sale)
    db.session.commit()
