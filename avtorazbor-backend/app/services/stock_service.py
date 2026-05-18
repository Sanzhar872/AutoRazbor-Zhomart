import uuid
from sqlalchemy import select, update
from app.extensions import db
from app.models.part import Part, PartStatus
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
        diff={"before": before, "after": part.stock, "delta": delta, "comment": comment},
    )
    db.session.commit()
    return part


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
