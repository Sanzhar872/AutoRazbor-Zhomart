import uuid
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError as MaValidationError
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part
from app.models.favorite import Favorite
from app.schemas.part import PartListItemSchema
from app.services import stock_service
from app.utils.favorite_slots import get_favorite_slots
from app.permissions import require_role
from app.errors import ValidationError, NotFoundError

bp = Blueprint("admin_stock", __name__, url_prefix="/api/v1/admin/stock")


class StockChangeSchema(Schema):
    delta   = fields.Integer(required=True, validate=validate.Range(min=1))
    comment = fields.String(load_default="")


class StockSetSchema(Schema):
    stock   = fields.Integer(required=True, validate=validate.Range(min=0))
    comment = fields.String(load_default="")


@bp.get("/")
@require_role("admin")
def list_stock() -> tuple[Response, int]:
    q        = request.args.get("q", "").strip()
    page     = max(1, int(request.args.get("page", 1)))
    per_page = min(50, int(request.args.get("per_page", 50)))

    stmt = select(Part).where(Part.deleted_at.is_(None)).order_by(Part.title)
    if q:
        stmt = stmt.where(Part.title.ilike(f"%{q}%"))

    total = db.session.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()
    parts = list(db.session.execute(stmt.offset((page - 1) * per_page).limit(per_page)).scalars())

    result = []
    for part in parts:
        fav_count = db.session.execute(
            select(func.count()).select_from(Favorite).where(Favorite.part_id == part.id)
        ).scalar_one()
        result.append({
            **PartListItemSchema().dump(part),
            "favorites_count":    fav_count,
            "max_favorite_slots": get_favorite_slots(part.stock),
        })

    pages = (total + per_page - 1) // per_page
    return jsonify({"items": result, "total": total, "page": page, "pages": pages}), 200


@bp.post("/<part_id>/increase")
@require_role("admin")
def increase(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockChangeSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    part = stock_service.increase_stock(uuid.UUID(part_id), data["delta"], actor_id, data["comment"])
    return jsonify(_stock_response(part)), 200


@bp.post("/<part_id>/set")
@require_role("admin")
def set_stock(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockSetSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    part = stock_service.set_stock(uuid.UUID(part_id), data["stock"], actor_id, data["comment"])
    return jsonify(_stock_response(part)), 200


def _get_or_404(part_id: str) -> Part:
    part = db.session.get(Part, uuid.UUID(part_id))
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    return part


def _stock_response(part: Part) -> dict:
    return {
        "part_id":    str(part.id),
        "title":      part.title,
        "stock":      part.stock,
        "status":     part.status,
    }
