import uuid
from sqlalchemy import select
from app.extensions import db
from app.models.part import Part, PartStatus
from app.models.audit import AuditLog
from app.errors import NotFoundError, StockUnderflowError
from app.services import audit_service


def increase_stock(part_id: uuid.UUID, delta: int, actor_id: uuid.UUID, comment: str = "") -> Part:
    part = _get_or_404(part_id)
    before = part.stock
    part.stock = before + delta
    _maybe_update_status(part)
    audit_service.log(
        "part.stock.increase", "part", part_id, actor_id,
        diff={"before": before, "after": part.stock, "delta": delta, "comment": comment},
    )
    db.session.commit()
    return part


def decrease_stock(part_id: uuid.UUID, delta: int, actor_id: uuid.UUID, comment: str = "") -> Part:
    part = _get_or_404(part_id)
    before = part.stock
    if before - delta < 0:
        raise StockUnderflowError(f"Нельзя списать {delta} — в наличии только {before}")
    part.stock = before - delta
    _maybe_update_status(part)
    audit_service.log(
        "part.stock.decrease", "part", part_id, actor_id,
        diff={"before": before, "after": part.stock, "delta": delta, "comment": comment, "price_kzt": float(part.price_kzt)},
    )
    db.session.commit()
    return part


def return_stock(part_id: uuid.UUID, delta: int, actor_id: uuid.UUID, comment: str = "") -> Part:
    part = _get_or_404(part_id)
    net_sold = _net_sold(part_id)
    if delta > net_sold:
        raise StockUnderflowError(f"Нельзя вернуть {delta} — чистые продажи: {net_sold} шт")
    before = part.stock
    part.stock = before + delta
    _maybe_update_status(part)
    audit_service.log(
        "part.stock.return", "part", part_id, actor_id,
        diff={"before": before, "after": part.stock, "delta": delta, "comment": comment},
    )
    db.session.commit()
    return part


def net_sold_for_part(part_id: uuid.UUID) -> int:
    return _net_sold(part_id)


def set_stock(part_id: uuid.UUID, stock: int, actor_id: uuid.UUID, comment: str = "") -> Part:
    if stock < 0:
        raise StockUnderflowError("Остаток не может быть отрицательным")
    part = _get_or_404(part_id)
    before = part.stock
    part.stock = stock
    _maybe_update_status(part)
    audit_service.log(
        "part.stock.set", "part", part_id, actor_id,
        diff={"before": before, "after": part.stock, "comment": comment},
    )
    db.session.commit()
    return part


def _net_sold(part_id: uuid.UUID) -> int:
    sold_rows = db.session.execute(
        select(AuditLog).where(AuditLog.action == "part.stock.decrease", AuditLog.entity_id == part_id)
    ).scalars().all()
    total_sold = sum(int((r.diff or {}).get("delta", 1)) for r in sold_rows)

    returned_rows = db.session.execute(
        select(AuditLog).where(AuditLog.action == "part.stock.return", AuditLog.entity_id == part_id)
    ).scalars().all()
    total_returned = sum(int((r.diff or {}).get("delta", 0)) for r in returned_rows)

    return max(0, total_sold - total_returned)


def _get_or_404(part_id: uuid.UUID) -> Part:
    part = db.session.get(Part, part_id)
    if not part or part.deleted_at:
        raise NotFoundError("Запчасть не найдена")
    return part


def _maybe_update_status(part: Part) -> None:
    if part.stock == 0 and part.status == PartStatus.active:
        part.status = PartStatus.sold_out
    elif part.stock > 0 and part.status == PartStatus.sold_out:
        part.status = PartStatus.active
