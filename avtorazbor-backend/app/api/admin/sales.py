import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, Response
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.audit import AuditLog
from app.models.part import Part
from app.permissions import require_role
from app.errors import NotFoundError
from app.services.stock_service import _maybe_update_status

bp = Blueprint("admin_sales", __name__, url_prefix="/api/v1/admin/sales")


def _get_sale(audit_id: str) -> AuditLog:
    log = db.session.get(AuditLog, uuid.UUID(audit_id))
    if not log or log.action != "part.stock.decrease":
        raise NotFoundError("Продажа не найдена")
    return log


@bp.delete("/<audit_id>")
@require_role("admin")
def delete_sale(audit_id: str) -> tuple[Response, int]:
    log = _get_sale(audit_id)
    if log.deleted_at:
        return jsonify({"ok": True}), 200
    # Восстанавливаем остаток на складе
    part = db.session.get(Part, log.entity_id)
    if part:
        delta = int((log.diff or {}).get("delta", 1))
        part.stock += delta
        _maybe_update_status(part)
    log.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"ok": True}), 200


@bp.post("/<audit_id>/restore")
@require_role("admin")
def restore_sale(audit_id: str) -> tuple[Response, int]:
    log = _get_sale(audit_id)
    if not log.deleted_at:
        return jsonify({"ok": True}), 200
    # Снова списываем остаток
    part = db.session.get(Part, log.entity_id)
    if part:
        delta = int((log.diff or {}).get("delta", 1))
        part.stock = max(0, part.stock - delta)
        _maybe_update_status(part)
    log.deleted_at = None
    db.session.commit()
    return jsonify({"ok": True}), 200


@bp.delete("/<audit_id>/permanent")
@require_role("admin")
def permanent_delete_sale(audit_id: str) -> tuple[Response, int]:
    log = _get_sale(audit_id)
    db.session.delete(log)
    db.session.commit()
    return jsonify({"ok": True}), 200
