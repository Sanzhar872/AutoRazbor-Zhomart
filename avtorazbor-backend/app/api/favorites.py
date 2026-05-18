import uuid
from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError as MaValidationError

from app.extensions import limiter
from app.schemas.favorite import FavoriteSchema, FavoriteAddSchema
from app.services import favorite_service
from app.permissions import require_auth
from app.errors import ValidationError
from app.config import get_settings

bp = Blueprint("favorites", __name__, url_prefix="/api/v1/favorites")
settings = get_settings()


@bp.get("/")
@require_auth
def list_favorites() -> tuple[Response, int]:
    user_id = uuid.UUID(get_jwt_identity())
    favorites = favorite_service.get_user_favorites(user_id)
    return jsonify(FavoriteSchema(many=True).dump(favorites)), 200


@bp.post("/")
@require_auth
@limiter.limit(settings.RATE_LIMIT_FAVORITES)
def add_favorite() -> tuple[Response, int]:
    user_id = uuid.UUID(get_jwt_identity())
    try:
        data = FavoriteAddSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    fav = favorite_service.add_to_favorites(user_id, data["part_id"])
    return jsonify(FavoriteSchema().dump(fav)), 201


@bp.delete("/<part_id>")
@require_auth
def remove_favorite(part_id: str) -> tuple[Response, int]:
    user_id = uuid.UUID(get_jwt_identity())
    favorite_service.remove_from_favorites(user_id, uuid.UUID(part_id))
    return jsonify({"message": "Удалено из избранного"}), 200
