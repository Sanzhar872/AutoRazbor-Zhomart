from dataclasses import dataclass
from typing import TypeVar, Generic
from sqlalchemy.orm import Query

T = TypeVar("T")


@dataclass
class PaginationMeta:
    total: int
    page: int
    per_page: int
    pages: int


def paginate(query: Query, page: int, per_page: int) -> tuple[list, PaginationMeta]:
    per_page = min(per_page, 100)
    page = max(page, 1)
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page if per_page else 0
    return items, PaginationMeta(total=total, page=page, per_page=per_page, pages=pages)


def paginated_response(items: list, meta: PaginationMeta, schema) -> dict:
    return {
        "items": schema.dump(items, many=True),
        "total": meta.total,
        "page": meta.page,
        "per_page": meta.per_page,
        "pages": meta.pages,
    }
