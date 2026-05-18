from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import get_jwt_identity
from marshmallow import ValidationError as MaValidationError

from app.extensions import limiter, db
from app.schemas.user import (
    UserCreateSchema, UserLoginSchema, UserPublicSchema,
    UserUpdateSchema, ChangePasswordSchema,
)
from app.services import auth_service
from app.models.user import User
from app.permissions import require_auth
from app.errors import ValidationError
from app.config import get_settings

bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")
settings = get_settings()


@bp.post("/register")
@limiter.limit(settings.RATE_LIMIT_AUTH)
def register() -> tuple[Response, int]:
    try:
        data = UserCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    user = auth_service.register_user(
        email=data["email"],
        password=data["password"],
        full_name=data["full_name"],
        phone=data.get("phone"),
    )
    return jsonify(UserPublicSchema().dump(user)), 201


@bp.post("/login")
@limiter.limit(settings.RATE_LIMIT_AUTH)
def login() -> tuple[Response, int]:
    try:
        data = UserLoginSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    access_token, refresh_token = auth_service.login_user(data["email"], data["password"])
    return jsonify({"access_token": access_token, "refresh_token": refresh_token}), 200


@bp.post("/refresh")
@limiter.limit("10 per minute")
def refresh() -> tuple[Response, int]:
    body = request.get_json() or {}
    raw_token = body.get("refresh_token")
    if not raw_token:
        raise ValidationError("refresh_token обязателен")
    access_token, new_refresh_token = auth_service.refresh_access_token(raw_token)
    return jsonify({"access_token": access_token, "refresh_token": new_refresh_token}), 200


@bp.post("/logout")
@require_auth
def logout() -> tuple[Response, int]:
    body = request.get_json() or {}
    raw_token = body.get("refresh_token", "")
    auth_service.logout_user(raw_token)
    return jsonify({"message": "Выход выполнен"}), 200


@bp.get("/me")
@require_auth
def me() -> tuple[Response, int]:
    user_id = get_jwt_identity()
    from sqlalchemy import select as sa_select
    user = db.session.execute(sa_select(User).where(User.id == user_id)).scalar_one_or_none()
    return jsonify(UserPublicSchema().dump(user)), 200


@bp.patch("/me")
@require_auth
def update_me() -> tuple[Response, int]:
    user_id = get_jwt_identity()
    from sqlalchemy import select as sa_select
    user = db.session.execute(sa_select(User).where(User.id == user_id)).scalar_one_or_none()
    try:
        data = UserUpdateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    for key, value in data.items():
        setattr(user, key, value)
    from app.extensions import db
    db.session.commit()
    return jsonify(UserPublicSchema().dump(user)), 200


@bp.post("/change-password")
@require_auth
def change_password() -> tuple[Response, int]:
    user_id = get_jwt_identity()
    try:
        data = ChangePasswordSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    import uuid
    auth_service.change_password(
        uuid.UUID(user_id), data["current_password"], data["new_password"]
    )
    return jsonify({"message": "Пароль изменён"}), 200
