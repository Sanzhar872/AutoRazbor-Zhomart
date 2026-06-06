from flask import Blueprint, jsonify, Response, request
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part, PartStatus
from app.models.favorite import Favorite
from app.models.audit import AuditLog
from app.permissions import require_role
from datetime import datetime, timezone, timedelta

bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/v1/admin")


def _period_revenue(start: datetime) -> int:
    """Net revenue = sales - returns since `start`, excluding soft-deleted sales."""
    sale_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(
            AuditLog.action == "part.stock.decrease",
            AuditLog.deleted_at.is_(None),
            AuditLog.created_at >= start,
        )
    ).all()
    total = sum(
        float((log.diff or {}).get("price_kzt") or part.price_kzt) * int((log.diff or {}).get("delta", 1))
        for log, part in sale_rows
    )

    return_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(
            AuditLog.action == "part.stock.return",
            AuditLog.deleted_at.is_(None),
            AuditLog.created_at >= start,
        )
    ).all()
    total -= sum(
        float((log.diff or {}).get("price_kzt") or part.price_kzt) * int((log.diff or {}).get("delta", 1))
        for log, part in return_rows
    )

    return max(0, int(total))


def _sale_record(log: AuditLog, part: Part) -> dict:
    diff = log.diff or {}
    delta = int(diff.get("delta", 1))
    price = float(diff.get("price_kzt") or part.price_kzt)
    is_return = log.action == "part.stock.return"
    return {
        "id":          str(log.id),
        "part_id":     str(part.id),
        "title":       part.title,
        "slug":        part.slug,
        "price_kzt":   price,
        "profit":      -(price * delta) if is_return else price * delta,
        "delta":       delta,
        "is_return":   is_return,
        "stock_before": diff.get("before"),
        "stock_after":  diff.get("after"),
        "comment":     diff.get("comment", ""),
        "sold_at":     log.created_at.isoformat() if log.created_at else None,
        "deleted_at":  log.deleted_at.isoformat() if log.deleted_at else None,
    }


@bp.get("/revenue")
@require_role("admin")
def revenue_by_period() -> tuple[Response, int]:
    try:
        date_from = datetime.fromisoformat(request.args["date_from"]).replace(tzinfo=timezone.utc)
        date_to   = datetime.fromisoformat(request.args["date_to"]).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except (KeyError, ValueError):
        return jsonify({"error": "Укажите date_from и date_to в формате YYYY-MM-DD"}), 400

    sale_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(
            AuditLog.action == "part.stock.decrease",
            AuditLog.deleted_at.is_(None),
            AuditLog.created_at >= date_from,
            AuditLog.created_at <= date_to,
        )
    ).all()
    sales_total = sum(float((log.diff or {}).get("price_kzt") or part.price_kzt) * int((log.diff or {}).get("delta", 1)) for log, part in sale_rows)
    sales_count = sum(int((log.diff or {}).get("delta", 1)) for log, part in sale_rows)

    return_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(
            AuditLog.action == "part.stock.return",
            AuditLog.deleted_at.is_(None),
            AuditLog.created_at >= date_from,
            AuditLog.created_at <= date_to,
        )
    ).all()
    returns_total = sum(float((log.diff or {}).get("price_kzt") or part.price_kzt) * int((log.diff or {}).get("delta", 1)) for log, part in return_rows)
    returns_count = sum(int((log.diff or {}).get("delta", 1)) for log, part in return_rows)

    return jsonify({
        "date_from":     date_from.date().isoformat(),
        "date_to":       date_to.date().isoformat(),
        "revenue":       max(0, int(sales_total - returns_total)),
        "sales_total":   int(sales_total),
        "returns_total": int(returns_total),
        "sales_count":   sales_count,
        "returns_count": returns_count,
    }), 200


@bp.get("/dashboard")
@require_role("admin")
def dashboard() -> tuple[Response, int]:
    now = datetime.now(timezone.utc)
    # Учитываем timezone клиента (offset в минутах, например UTC+5 = -300 от JS getTimezoneOffset)
    tz_offset_min = int(request.args.get("tz", 0))  # JS: new Date().getTimezoneOffset() (отрицательный для UTC+)
    local_now = now - timedelta(minutes=tz_offset_min)
    today_start  = local_now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(minutes=tz_offset_min)
    week_start   = today_start - timedelta(days=local_now.weekday())
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
            AuditLog.deleted_at.is_(None),
            AuditLog.created_at >= today_start,
        )
    ).scalar_one()

    sold_total = db.session.execute(
        select(func.count()).select_from(AuditLog).where(
            AuditLog.action == "part.stock.decrease",
            AuditLog.deleted_at.is_(None),
        )
    ).scalar_one()

    # Recent operations: sales + returns (not deleted)
    recent_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(
            AuditLog.action.in_(["part.stock.decrease", "part.stock.return"]),
            AuditLog.deleted_at.is_(None),
        )
        .order_by(AuditLog.created_at.desc())
        .limit(20)
    ).all()
    recent_sales = [_sale_record(log, part) for log, part in recent_rows]

    # Deleted sales (trash)
    deleted_rows = db.session.execute(
        select(AuditLog, Part)
        .join(Part, Part.id == AuditLog.entity_id)
        .where(AuditLog.action == "part.stock.decrease", AuditLog.deleted_at.isnot(None))
        .order_by(AuditLog.deleted_at.desc())
        .limit(50)
    ).all()
    deleted_sales = [_sale_record(log, part) for log, part in deleted_rows]

    top_favorites = db.session.execute(
        select(Part, func.count(Favorite.id).label("fav_count"))
        .join(Favorite, Favorite.part_id == Part.id)
        .where(Part.deleted_at.is_(None))
        .group_by(Part.id)
        .order_by(func.count(Favorite.id).desc())
        .limit(5)
    ).all()

    return jsonify({
        "total_parts":    total,
        "active_parts":   active,
        "low_stock_parts": low_stock,
        "added_today":    added_today,
        "sold_today":     sold_today,
        "sold_total":     sold_total,
        "recent_sales":   recent_sales,
        "deleted_sales":  deleted_sales,
        "top_favorites":  [
            {"id": str(p.id), "title": p.title, "favorites": cnt}
            for p, cnt in top_favorites
        ],
        "revenue": {
            "today": _period_revenue(today_start),
            "week":  _period_revenue(week_start),
            "month": _period_revenue(month_start),
        },
    }), 200
