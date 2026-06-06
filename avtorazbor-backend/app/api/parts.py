import uuid
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from marshmallow import ValidationError as MaValidationError

from app.schemas.part import PartPublicSchema, PartListItemSchema, PartCreateSchema, PartUpdateSchema
from app.services import part_service, favorite_service
from app.permissions import require_role
from app.errors import ValidationError
from app.utils.pagination import paginated_response

bp = Blueprint("parts", __name__, url_prefix="/api/v1/parts")


@bp.get("/")
def list_parts() -> tuple[Response, int]:
    args = request.args
    items, meta = part_service.get_parts(
        category_id=_uuid_or_none(args.get("category_id")),
        make_id=_uuid_or_none(args.get("make_id")),
        model_id=_uuid_or_none(args.get("model_id")),
        generation_id=_uuid_or_none(args.get("generation_id")),
        status=args.get("status", "active") or None,
        condition=args.get("condition"),
        price_min=_float_or_none(args.get("price_min")),
        price_max=_float_or_none(args.get("price_max")),
        oem=args.get("oem"),
        q=args.get("q"),
        sort=args.get("sort", "newest"),
        page=int(args.get("page", 1)),
        per_page=int(args.get("per_page", 20)),
    )
    return jsonify(paginated_response(items, meta, PartListItemSchema())), 200


@bp.get("/<slug>")
def get_part(slug: str) -> tuple[Response, int]:
    part = part_service.get_part_by_slug(slug)

    user_id = None
    try:
        verify_jwt_in_request(optional=True)
        raw = get_jwt_identity()
        if raw:
            user_id = uuid.UUID(raw)
    except Exception:
        pass

    data = PartPublicSchema().dump(part)
    data["favorite_meta"] = favorite_service.build_favorite_meta(part, user_id)
    return jsonify(data), 200


@bp.post("/")
@require_role("admin")
def create_part() -> tuple[Response, int]:
    try:
        data = PartCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    part = part_service.create_part(data)
    return jsonify(PartPublicSchema().dump(part)), 201


@bp.patch("/<part_id>")
@require_role("admin")
def update_part(part_id: str) -> tuple[Response, int]:
    try:
        data = PartUpdateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    part = part_service.update_part(uuid.UUID(part_id), data)
    return jsonify(PartPublicSchema().dump(part)), 200


@bp.delete("/<part_id>")
@require_role("admin")
def delete_part(part_id: str) -> tuple[Response, int]:
    part_service.soft_delete_part(uuid.UUID(part_id))
    return jsonify({"message": "Удалено"}), 200


@bp.delete("/")
@require_role("admin")
def delete_all_parts() -> tuple[Response, int]:
    from sqlalchemy import update
    from datetime import datetime, timezone
    from app.models.part import PartStatus
    from app.extensions import db
    now = datetime.now(timezone.utc)
    db.session.execute(
        update(part_service.Part)
        .where(part_service.Part.deleted_at.is_(None))
        .values(deleted_at=now, status=PartStatus.archived)
    )
    db.session.commit()
    return jsonify({"message": "Все товары удалены"}), 200


@bp.post("/<part_id>/images")
@require_role("admin")
def add_image(part_id: str) -> tuple[Response, int]:
    from app.extensions import db
    from app.models.part import PartImage
    from app.models.media import MediaAsset
    from sqlalchemy import select
    body = request.get_json() or {}
    asset_id = body.get("asset_id")
    position = body.get("position", 0)
    is_primary = body.get("is_primary", False)
    if not asset_id:
        raise ValidationError("asset_id обязателен")
    asset = db.session.get(MediaAsset, uuid.UUID(asset_id))
    if not asset:
        raise ValidationError("Медиафайл не найден")
    from datetime import datetime, timezone
    img = PartImage(
        part_id=uuid.UUID(part_id),
        asset_id=asset.id,
        position=position,
        is_primary=is_primary,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    if is_primary:
        # снять is_primary со старых
        for old in db.session.execute(
            select(PartImage).where(PartImage.part_id == uuid.UUID(part_id), PartImage.is_primary == True)
        ).scalars():
            old.is_primary = False
    db.session.add(img)
    db.session.commit()
    return jsonify({"id": str(img.id), "public_url": asset.public_url, "position": img.position, "is_primary": img.is_primary}), 201


@bp.delete("/<part_id>/images/<image_id>")
@require_role("admin")
def remove_image(part_id: str, image_id: str) -> tuple[Response, int]:
    from app.extensions import db
    from app.models.part import PartImage
    img = db.session.get(PartImage, uuid.UUID(image_id))
    if not img or str(img.part_id) != part_id:
        raise ValidationError("Фото не найдено")
    db.session.delete(img)
    db.session.commit()
    return jsonify({"message": "Удалено"}), 200


def _uuid_or_none(v: str | None) -> uuid.UUID | None:
    try:
        return uuid.UUID(v) if v else None
    except ValueError:
        return None


def _float_or_none(v: str | None) -> float | None:
    try:
        return float(v) if v else None
    except ValueError:
        return None
