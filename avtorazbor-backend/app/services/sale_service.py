import uuid
from datetime import datetime, timezone
from sqlalchemy import select, func

from app.extensions import db
from app.models.sale import Sale, SaleStatus
from app.models.part import Part, PartStatus
from app.errors import NotFoundError, ValidationError


def _get_part(part_id: uuid.UUID) -> Part:
    part = db.session.get(Part, part_id)
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    return part


def _get_sale(sale_id: uuid.UUID) -> Sale:
    sale = db.session.get(Sale, sale_id)
    if not sale:
        raise NotFoundError("Продажа не найдена")
    return sale


def _update_part_status(part: Part) -> None:
    if part.stock == 0 and part.status == PartStatus.active:
        part.status = PartStatus.sold_out
    elif part.stock > 0 and part.status == PartStatus.sold_out:
        part.status = PartStatus.active


def create_sale(part_id: uuid.UUID, qty: int, comment: str, actor_id: uuid.UUID | None) -> Sale:
    part = _get_part(part_id)
    if part.stock < qty:
        raise ValidationError(f"Недостаточно товара: в наличии {part.stock} шт")

    sale = Sale(
        part_id=part_id,
        actor_id=actor_id,
        qty=qty,
        price_kzt=float(part.price_kzt),
        total_kzt=float(part.price_kzt) * qty,
        comment=comment,
        status=SaleStatus.active,
    )
    db.session.add(sale)

    part.stock -= qty
    _update_part_status(part)
    db.session.commit()
    return sale


def return_sale(sale_id: uuid.UUID) -> Sale:
    sale = _get_sale(sale_id)
    if sale.status == SaleStatus.returned:
        raise ValidationError("Эта продажа уже возвращена")

    part = _get_part(sale.part_id)
    part.stock += sale.qty
    _update_part_status(part)

    sale.status = SaleStatus.returned
    sale.returned_at = datetime.now(timezone.utc)
    db.session.commit()
    return sale


def delete_sale(sale_id: uuid.UUID) -> None:
    sale = _get_sale(sale_id)

    # Если продажа активна — восстанавливаем склад
    if sale.status == SaleStatus.active:
        part = db.session.get(Part, sale.part_id)
        if part:
            part.stock += sale.qty
            _update_part_status(part)

    db.session.delete(sale)
    db.session.commit()


def list_sales(
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[Sale], int, int]:
    from sqlalchemy.orm import selectinload, joinedload
    from app.models.part import Part
    stmt = (
        select(Sale)
        .join(Part, Part.id == Sale.part_id)
        .where(Part.deleted_at.is_(None))
        .options(selectinload(Sale.part))
        .order_by(Sale.created_at.desc())
    )

    if status:
        stmt = stmt.where(Sale.status == status)
        # Возвраты фильтруем по дате возврата
        if status == SaleStatus.returned:
            if date_from:
                stmt = stmt.where(Sale.returned_at >= date_from)
            if date_to:
                stmt = stmt.where(Sale.returned_at <= date_to)
        else:
            if date_from:
                stmt = stmt.where(Sale.created_at >= date_from)
            if date_to:
                stmt = stmt.where(Sale.created_at <= date_to)
    else:
        if date_from:
            stmt = stmt.where(Sale.created_at >= date_from)
        if date_to:
            stmt = stmt.where(Sale.created_at <= date_to)

    total = db.session.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()

    per_page = min(per_page, 100)
    items = list(db.session.execute(
        stmt.offset((page - 1) * per_page).limit(per_page)
    ).scalars())

    pages = (total + per_page - 1) // per_page if per_page else 0
    return items, total, pages


def revenue_for_period(date_from: datetime, date_to: datetime) -> dict:
    from app.models.part import Part
    # Выручка = сумма активных продаж за период (только по существующим товарам)
    sales = db.session.execute(
        select(func.sum(Sale.total_kzt), func.count(Sale.id), func.sum(Sale.qty))
        .join(Part, Part.id == Sale.part_id)
        .where(
            Sale.status == SaleStatus.active,
            Sale.created_at >= date_from,
            Sale.created_at <= date_to,
            Part.deleted_at.is_(None),
        )
    ).one()

    # Возвраты за период (по дате возврата, только существующие товары)
    returns = db.session.execute(
        select(func.sum(Sale.total_kzt), func.count(Sale.id), func.sum(Sale.qty))
        .join(Part, Part.id == Sale.part_id)
        .where(
            Sale.status == SaleStatus.returned,
            Sale.returned_at >= date_from,
            Sale.returned_at <= date_to,
            Part.deleted_at.is_(None),
        )
    ).one()

    sales_total = float(sales[0] or 0)
    returns_total = float(returns[0] or 0)

    return {
        "revenue":       round(sales_total - returns_total, 2),
        "sales_total":   round(sales_total, 2),
        "sales_count":   int(sales[1] or 0),
        "sales_qty":     int(sales[2] or 0),
        "returns_total": round(returns_total, 2),
        "returns_count": int(returns[1] or 0),
        "returns_qty":   int(returns[2] or 0),
    }
