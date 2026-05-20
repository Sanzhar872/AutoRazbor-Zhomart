import uuid
from collections import defaultdict
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError as MaValidationError
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part
from app.models.audit import AuditLog
from app.models.favorite import Favorite
from app.schemas.part import PartListItemSchema
from app.services import stock_service
from app.utils.favorite_slots import get_favorite_slots
from app.permissions import require_role
from app.errors import ValidationError, NotFoundError

bp = Blueprint("admin_stock", __name__, url_prefix="/api/v1/admin/stock")


class StockChangeSchema(Schema):
    delta = fields.Integer(required=True, validate=validate.Range(min=1))
    comment = fields.String(load_default="")


class StockSetSchema(Schema):
    stock = fields.Integer(required=True, validate=validate.Range(min=0))
    comment = fields.String(load_default="")


@bp.get("/")
@require_role("admin")
def list_stock() -> tuple[Response, int]:
    parts = list(db.session.execute(
        select(Part).where(Part.deleted_at.is_(None)).order_by(Part.title)
    ).scalars())

    # Bulk calculate net_sold per part (sold - returned)
    audit_rows = db.session.execute(
        select(AuditLog.entity_id, AuditLog.action, AuditLog.diff)
        .where(AuditLog.action.in_(["part.stock.decrease", "part.stock.return"]))
    ).all()
    net_sold_map: dict[uuid.UUID, int] = defaultdict(int)
    for entity_id, action, diff in audit_rows:
        delta = int((diff or {}).get("delta", 1))
        if action == "part.stock.decrease":
            net_sold_map[entity_id] += delta
        else:
            net_sold_map[entity_id] -= delta

    result = []
    for part in parts:
        fav_count = db.session.execute(
            select(func.count()).select_from(Favorite).where(Favorite.part_id == part.id)
        ).scalar_one()
        result.append({
            **PartListItemSchema().dump(part),
            "favorites_count": fav_count,
            "max_favorite_slots": get_favorite_slots(part.stock),
            "net_sold": max(0, net_sold_map.get(part.id, 0)),
        })
    return jsonify(result), 200


@bp.post("/<part_id>/increase")
@require_role("admin")
def increase(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockChangeSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    before_part = _get_or_404(part_id)
    before_stock = before_part.stock
    part = stock_service.increase_stock(uuid.UUID(part_id), data["delta"], actor_id, data["comment"])
    return jsonify(_stock_response(part, before_stock)), 200


@bp.post("/<part_id>/decrease")
@require_role("admin")
def decrease(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockChangeSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    before_stock = _get_or_404(part_id).stock
    part = stock_service.decrease_stock(uuid.UUID(part_id), data["delta"], actor_id, data["comment"])
    return jsonify(_stock_response(part, before_stock)), 200


@bp.post("/<part_id>/return")
@require_role("admin")
def return_part(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockChangeSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    before_stock = _get_or_404(part_id).stock
    part = stock_service.return_stock(uuid.UUID(part_id), data["delta"], actor_id, data["comment"])
    return jsonify(_stock_response(part, before_stock)), 200


@bp.post("/<part_id>/set")
@require_role("admin")
def set_stock(part_id: str) -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = StockSetSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    before_stock = _get_or_404(part_id).stock
    part = stock_service.set_stock(uuid.UUID(part_id), data["stock"], actor_id, data["comment"])
    return jsonify(_stock_response(part, before_stock)), 200


def _get_or_404(part_id: str) -> Part:
    part = db.session.get(Part, uuid.UUID(part_id))
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    return part


def _stock_response(part: Part, before: int) -> dict:
    from datetime import datetime, timezone
    return {
        "part_id": str(part.id),
        "title": part.title,
        "stock_before": before,
        "stock_after": part.stock,
        "max_favorites_before": get_favorite_slots(before),
        "max_favorites_after": get_favorite_slots(part.stock),
        "changed_at": datetime.now(timezone.utc).isoformat(),
    }
