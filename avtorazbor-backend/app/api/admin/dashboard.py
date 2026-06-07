from datetime import datetime, timezone, timedelta
from flask import Blueprint, jsonify, Response, request
from sqlalchemy import select, func

from app.extensions import db
from app.models.part import Part, PartStatus
from app.models.favorite import Favorite
from app.models.sale import Sale, SaleStatus
from app.permissions import require_role
from app.services.sale_service import revenue_for_period

bp = Blueprint("admin_dashboard", __name__, url_prefix="/api/v1/admin")


def _period_revenue(date_from: datetime, date_to: datetime) -> float:
    result = db.session.execute(
        select(func.coalesce(func.sum(Sale.total_kzt), 0))
        .where(Sale.status == SaleStatus.active, Sale.created_at >= date_from, Sale.created_at <= date_to)
    ).scalar_one()
    return float(result)


@bp.get("/dashboard")
@require_role("admin")
def dashboard() -> tuple[Response, int]:
    # Учитываем timezone клиента
    tz_offset_min = int(request.args.get("tz", 0))
    now = datetime.now(timezone.utc)
    local_now = now - timedelta(minutes=tz_offset_min)
    today_start = local_now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(minutes=tz_offset_min)
    week_start  = today_start - timedelta(days=local_now.weekday())
    month_start = today_start.replace(day=1)
    today_end   = today_start + timedelta(days=1)

    # Статистика товаров
    total = db.session.execute(
        select(func.count()).select_from(Part).where(Part.deleted_at.is_(None))
    ).scalar_one()

    active = db.session.execute(
        select(func.count()).select_from(Part).where(Part.deleted_at.is_(None), Part.status == PartStatus.active)
    ).scalar_one()

    low_stock = db.session.execute(
        select(func.count()).select_from(Part).where(Part.deleted_at.is_(None), Part.stock < 5, Part.stock > 0)
    ).scalar_one()

    added_today = db.session.execute(
        select(func.count()).select_from(Part).where(Part.created_at >= today_start)
    ).scalar_one()

    # Статистика продаж из таблицы sales
    sold_today = db.session.execute(
        select(func.coalesce(func.sum(Sale.qty), 0))
        .where(Sale.status == SaleStatus.active, Sale.created_at >= today_start, Sale.created_at < today_end)
    ).scalar_one()

    sold_total = db.session.execute(
        select(func.coalesce(func.sum(Sale.qty), 0))
        .where(Sale.status == SaleStatus.active)
    ).scalar_one()

    # Последние 20 операций (продажи + возвраты)
    recent_rows = db.session.execute(
        select(Sale).where(Sale.status == SaleStatus.active)
        .order_by(Sale.created_at.desc()).limit(10)
    ).scalars().all()

    returned_rows = db.session.execute(
        select(Sale).where(Sale.status == SaleStatus.returned)
        .order_by(Sale.returned_at.desc()).limit(10)
    ).scalars().all()

    # Объединяем и сортируем
    all_ops = sorted(
        [_sale_dict(s, is_return=False) for s in recent_rows] +
        [_sale_dict(s, is_return=True) for s in returned_rows],
        key=lambda x: x["sort_dt"],
        reverse=True
    )[:20]

    # Топ избранных
    top_favorites = db.session.execute(
        select(Part, func.count(Favorite.id).label("fav_count"))
        .join(Favorite, Favorite.part_id == Part.id)
        .where(Part.deleted_at.is_(None))
        .group_by(Part.id)
        .order_by(func.count(Favorite.id).desc())
        .limit(5)
    ).all()

    return jsonify({
        "total_parts":     total,
        "active_parts":    active,
        "low_stock_parts": low_stock,
        "added_today":     added_today,
        "sold_today":      int(sold_today),
        "sold_total":      int(sold_total),
        "recent_sales":    all_ops,
        "deleted_sales":   [],
        "top_favorites":   [{"id": str(p.id), "title": p.title, "favorites": cnt} for p, cnt in top_favorites],
        "revenue": {
            "today": _period_revenue(today_start, today_end),
            "week":  _period_revenue(week_start,  now),
            "month": _period_revenue(month_start, now),
        },
    }), 200


@bp.get("/revenue")
@require_role("admin")
def revenue_endpoint() -> tuple[Response, int]:
    try:
        date_from = datetime.fromisoformat(request.args["date_from"]).replace(tzinfo=timezone.utc)
        date_to   = datetime.fromisoformat(request.args["date_to"]).replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except (KeyError, ValueError):
        return jsonify({"error": "Укажите date_from и date_to в формате YYYY-MM-DD"}), 400
    return jsonify(revenue_for_period(date_from, date_to)), 200


def _sale_dict(sale: Sale, is_return: bool) -> dict:
    dt = sale.returned_at if is_return else sale.created_at
    return {
        "id":         str(sale.id),
        "part_id":    str(sale.part_id),
        "title":      sale.part.title if sale.part else "",
        "slug":       sale.part.slug if sale.part else "",
        "price_kzt":  float(sale.price_kzt),
        "profit":     -(float(sale.total_kzt)) if is_return else float(sale.total_kzt),
        "delta":      sale.qty,
        "is_return":  is_return,
        "comment":    sale.comment,
        "sold_at":    dt.isoformat() if dt else None,
        "deleted_at": None,
        "sort_dt":    dt.isoformat() if dt else "",
    }
