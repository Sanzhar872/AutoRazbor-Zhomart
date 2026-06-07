import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, fields, validate, ValidationError as MaValidationError

from app.permissions import require_role
from app.errors import ValidationError, NotFoundError
from app.services import sale_service

bp = Blueprint("admin_sales", __name__, url_prefix="/api/v1/admin/sales")


class CreateSaleSchema(Schema):
    part_id  = fields.UUID(required=True)
    qty      = fields.Integer(required=True, validate=validate.Range(min=1))
    comment  = fields.String(load_default="")


def _sale_dict(sale) -> dict:
    return {
        "id":          str(sale.id),
        "part_id":     str(sale.part_id),
        "title":       sale.part.title if sale.part else "",
        "slug":        sale.part.slug if sale.part else "",
        "qty":         sale.qty,
        "price_kzt":   float(sale.price_kzt),
        "total_kzt":   float(sale.total_kzt),
        "comment":     sale.comment,
        "status":      sale.status,
        "returned_at": sale.returned_at.isoformat() if sale.returned_at else None,
        "created_at":  sale.created_at.isoformat() if sale.created_at else None,
    }


@bp.get("/")
@require_role("admin")
def list_sales() -> tuple[Response, int]:
    status    = request.args.get("status")
    page      = max(1, int(request.args.get("page", 1)))
    per_page  = min(100, int(request.args.get("per_page", 50)))
    date_from = _parse_dt(request.args.get("date_from"))
    date_to   = _parse_dt(request.args.get("date_to"), end_of_day=True)

    items, total, pages = sale_service.list_sales(
        status=status, date_from=date_from, date_to=date_to,
        page=page, per_page=per_page,
    )
    return jsonify({
        "items":    [_sale_dict(s) for s in items],
        "total":    total,
        "page":     page,
        "pages":    pages,
    }), 200


@bp.post("/")
@require_role("admin")
def create_sale() -> tuple[Response, int]:
    actor_id = uuid.UUID(get_jwt_identity())
    try:
        data = CreateSaleSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))

    sale = sale_service.create_sale(
        part_id=data["part_id"],
        qty=data["qty"],
        comment=data["comment"],
        actor_id=actor_id,
    )
    return jsonify(_sale_dict(sale)), 201


@bp.post("/<sale_id>/return")
@require_role("admin")
def return_sale(sale_id: str) -> tuple[Response, int]:
    sale = sale_service.return_sale(uuid.UUID(sale_id))
    return jsonify(_sale_dict(sale)), 200


@bp.delete("/<sale_id>")
@require_role("admin")
def delete_sale(sale_id: str) -> tuple[Response, int]:
    sale_service.delete_sale(uuid.UUID(sale_id))
    return jsonify({"ok": True}), 200


@bp.get("/revenue")
@require_role("admin")
def revenue() -> tuple[Response, int]:
    date_from = _parse_dt(request.args.get("date_from"))
    date_to   = _parse_dt(request.args.get("date_to"), end_of_day=True)
    if not date_from or not date_to:
        return jsonify({"error": "Укажите date_from и date_to"}), 400
    return jsonify(sale_service.revenue_for_period(date_from, date_to)), 200


def _parse_dt(val: str | None, end_of_day: bool = False) -> datetime | None:
    if not val:
        return None
    try:
        dt = datetime.fromisoformat(val).replace(tzinfo=timezone.utc)
        if end_of_day:
            dt = dt.replace(hour=23, minute=59, second=59)
        return dt
    except ValueError:
        return None
