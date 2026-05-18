import uuid
from flask import Blueprint, jsonify, request, Response
from marshmallow import ValidationError as MaValidationError

from sqlalchemy import select
from app.extensions import db
from app.models.category import Category
from app.schemas.category import CategorySchema, CategoryCreateSchema, CategoryUpdateSchema
from app.services.slug_service import make_unique_slug
from app.permissions import require_role
from app.errors import NotFoundError, ValidationError
from datetime import datetime, timezone

bp = Blueprint("categories", __name__, url_prefix="/api/v1/categories")


def _strip_deleted(cats: list) -> list:
    """Recursively remove soft-deleted children so they don't appear in API."""
    result = []
    for cat in cats:
        if cat.deleted_at:
            continue
        cat.children = _strip_deleted(cat.children)
        result.append(cat)
    return result


@bp.get("/")
def list_categories() -> tuple[Response, int]:
    roots = list(db.session.execute(
        select(Category)
        .where(Category.parent_id.is_(None), Category.deleted_at.is_(None))
        .order_by(Category.sort_order, Category.name)
    ).scalars())
    roots = _strip_deleted(roots)
    return jsonify(CategorySchema(many=True).dump(roots)), 200


@bp.post("/")
@require_role("admin")
def create_category() -> tuple[Response, int]:
    try:
        data = CategoryCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    slug = make_unique_slug(data["name"], "categories")
    cat = Category(
        name=data["name"],
        slug=slug,
        parent_id=data.get("parent_id"),
        icon_url=data.get("icon_url"),
        sort_order=data.get("sort_order", 0),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(CategorySchema().dump(cat)), 201


@bp.patch("/<cat_id>")
@require_role("admin")
def update_category(cat_id: str) -> tuple[Response, int]:
    cat = db.session.get(Category, uuid.UUID(cat_id))
    if not cat or cat.deleted_at:
        raise NotFoundError("Категория не найдена")
    try:
        data = CategoryUpdateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    if "name" in data and data["name"] != cat.name:
        data["slug"] = make_unique_slug(data["name"], "categories", existing_id=cat.id)
    for key, value in data.items():
        setattr(cat, key, value)
    db.session.commit()
    return jsonify(CategorySchema().dump(cat)), 200


@bp.delete("/<cat_id>")
@require_role("admin")
def delete_category(cat_id: str) -> tuple[Response, int]:
    try:
        cat_uuid = uuid.UUID(cat_id)
    except (ValueError, AttributeError):
        raise NotFoundError("Категория не найдена")
    cat = db.session.execute(
        select(Category).where(Category.id == cat_uuid, Category.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not cat:
        raise NotFoundError("Категория не найдена")
    cat.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"message": "Удалено"}), 200
