from flask import Blueprint, jsonify, Response
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part, PartStatus
from app.models.favorite import Favorite
from app.models.audit import AuditLog
from app.permissions import require_role
from datetime import datetime, timezone

bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/v1/admin")


@bp.get("/dashboard")
@require_role("admin")
def dashboard() -> tuple[Response, int]:
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    total = db.session.execute(
        select(func.count()).select_from(Part).where(Part.deleted_at.is_(None))
    ).scalar_one()

    active = db.session.execute(
        select(func.count()).select_from(Part).where(
            Part.deleted_at.is_(None), Part.status == PartStatus.active
        )
    ).scalar_one()

    low_stock = db.session.execute(
        select(func.count()).select_from(Part).where(
            Part.deleted_at.is_(None), Part.stock < 5, Part.stock > 0
        )
    ).scalar_one()

    added_today = db.session.execute(
        select(func.count()).select_from(Part).where(Part.created_at >= today_start)
    ).scalar_one()

    # Продажи (decrease operations)
    sold_today = db.session.execute(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.action == "part.stock.decrease",
            AuditLog.created_at >= today_start,
        )
    ).scalar_one()

    sold_total = db.session.execute(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.action == "part.stock.decrease"
        )
    ).scalar_one()

    # Recent sales — last 10
    recent_sales_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(AuditLog.action == "part.stock.decrease")
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    ).all()

    recent_sales = []
    for log, part in recent_sales_rows:
        diff = log.diff or {}
        recent_sales.append({
            "part_id": str(part.id),
            "title": part.title,
            "slug": part.slug,
            "delta": diff.get("delta", 1),
            "stock_before": diff.get("before"),
            "stock_after": diff.get("after"),
            "comment": diff.get("comment", ""),
            "sold_at": log.created_at.isoformat() if log.created_at else None,
        })

    top_favorites = db.session.execute(
        select(Part, func.count(Favorite.id).label("fav_count"))
        .join(Favorite, Favorite.part_id == Part.id)
        .where(Part.deleted_at.is_(None))
        .group_by(Part.id)
        .order_by(func.count(Favorite.id).desc())
        .limit(5)
    ).all()

    return jsonify({
        "total_parts": total,
        "active_parts": active,
        "low_stock_parts": low_stock,
        "added_today": added_today,
        "sold_today": sold_today,
        "sold_total": sold_total,
        "recent_sales": recent_sales,
        "top_favorites": [
            {"id": str(p.id), "title": p.title, "favorites": cnt}
            for p, cnt in top_favorites
        ],
    }), 200
