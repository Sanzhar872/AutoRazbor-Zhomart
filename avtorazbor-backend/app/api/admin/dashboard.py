from flask import Blueprint, jsonify, Response
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part, PartStatus
from app.models.favorite import Favorite
from app.models.audit import AuditLog
from app.permissions import require_role
from datetime import datetime, timezone, timedelta

bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/v1/admin")


def _period_revenue(start: datetime) -> int:
    """Sum of price_kzt * delta for all sales since `start`."""
    rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(AuditLog.action == "part.stock.decrease", AuditLog.created_at >= start)
    ).all()
    total = 0
    for log, part in rows:
        diff = log.diff or {}
        total += part.price_kzt * int(diff.get("delta", 1))
    return total


@bp.get("/dashboard")
@require_role("admin")
def dashboard() -> tuple[Response, int]:
    now = datetime.now(timezone.utc)
    today_start  = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start   = today_start - timedelta(days=now.weekday())
    month_start  = today_start.replace(day=1)

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

    # Recent sales — last 20, with price
    recent_sales_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(AuditLog.action == "part.stock.decrease")
        .order_by(AuditLog.created_at.desc())
        .limit(20)
    ).all()

    recent_sales = []
    for log, part in recent_sales_rows:
        diff = log.diff or {}
        delta = int(diff.get("delta", 1))
        recent_sales.append({
            "part_id":     str(part.id),
            "title":       part.title,
            "slug":        part.slug,
            "price_kzt":   part.price_kzt,
            "profit":      part.price_kzt * delta,
            "delta":       delta,
            "stock_before": diff.get("before"),
            "stock_after":  diff.get("after"),
            "comment":     diff.get("comment", ""),
            "sold_at":     log.created_at.isoformat() if log.created_at else None,
        })

    top_favorites = db.session.execute(
        select(Part, func.count(Favorite.id).label("fav_count"))
        .join(Favorite, Favorite.part_id == Part.id)
        .where(Part.deleted_at.is_(None))
        .group_by(Part.id)
        .order_by(func.count(Favorite.id).desc())
        .limit(5)
    ).all()

    # Revenue by period
    revenue_today = _period_revenue(today_start)
    revenue_week  = _period_revenue(week_start)
    revenue_month = _period_revenue(month_start)

    return jsonify({
        "total_parts":    total,
        "active_parts":   active,
        "low_stock_parts": low_stock,
        "added_today":    added_today,
        "sold_today":     sold_today,
        "sold_total":     sold_total,
        "recent_sales":   recent_sales,
        "top_favorites":  [
            {"id": str(p.id), "title": p.title, "favorites": cnt}
            for p, cnt in top_favorites
        ],
        "revenue": {
            "today": revenue_today,
            "week":  revenue_week,
            "month": revenue_month,
        },
    }), 200
