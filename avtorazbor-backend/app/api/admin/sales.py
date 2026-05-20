import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, Response
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.audit import AuditLog
from app.permissions import require_role
from app.errors import NotFoundError

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
    log.deleted_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify({"ok": True}), 200


@bp.post("/<audit_id>/restore")
@require_role("admin")
def restore_sale(audit_id: str) -> tuple[Response, int]:
    log = _get_sale(audit_id)
    log.deleted_at = None
    db.session.commit()
    return jsonify({"ok": True}), 200
