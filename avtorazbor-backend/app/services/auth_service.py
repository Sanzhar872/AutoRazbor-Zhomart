import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token, create_refresh_token, decode_token
from sqlalchemy import select, update

from app.extensions import db
from app.models.user import User, RefreshToken, UserRole
from app.utils.pwhash import hash_password, verify_password
from app.errors import UnauthorizedError, ConflictError, NotFoundError
from app.config import get_settings


def register_user(email: str, password: str, full_name: str, phone: str | None = None) -> User:
    existing = db.session.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()
    if existing:
        raise ConflictError("Пользователь с таким email уже существует")

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name,
        phone=phone,
        role=UserRole.customer,
    )
    db.session.add(user)
    db.session.commit()
    return user


def login_user(email: str, password: str) -> tuple[str, str]:
    user = db.session.execute(select(User).where(User.email == email.lower())).scalar_one_or_none()
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Неверный email или пароль")
    if not user.is_active:
        raise UnauthorizedError("Аккаунт заблокирован")

    user.last_login_at = datetime.now(timezone.utc)
    db.session.commit()

    access_token = _make_access_token(user)
    refresh_token = _make_refresh_token(user)
    return access_token, refresh_token


def refresh_access_token(raw_refresh_token: str) -> tuple[str, str]:
    try:
        decode_token(raw_refresh_token)
    except Exception:
        raise UnauthorizedError("Невалидный refresh token")

    token_hash = _hash_token(raw_refresh_token)
    stored = db.session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).scalar_one_or_none()

    if not stored or stored.revoked_at or stored.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Refresh token недействителен или истёк")

    user = db.session.get(User, stored.user_id)
    if not user or not user.is_active:
        raise UnauthorizedError("Пользователь не найден или заблокирован")

    stored.revoked_at = datetime.now(timezone.utc)
    db.session.commit()

    access_token = _make_access_token(user)
    new_refresh_token = _make_refresh_token(user)
    return access_token, new_refresh_token


def logout_user(raw_refresh_token: str) -> None:
    token_hash = _hash_token(raw_refresh_token)
    stored = db.session.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    ).scalar_one_or_none()
    if stored and not stored.revoked_at:
        stored.revoked_at = datetime.now(timezone.utc)
        db.session.commit()


def change_password(user_id: uuid.UUID, current_password: str, new_password: str) -> None:
    user = db.session.get(User, user_id)
    if not user:
        raise NotFoundError("Пользователь не найден")
    if not verify_password(current_password, user.password_hash):
        raise UnauthorizedError("Неверный текущий пароль")
    user.password_hash = hash_password(new_password)
    db.session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .values(revoked_at=datetime.now(timezone.utc))
    )
    db.session.commit()


def _make_access_token(user: User) -> str:
    return create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role.value, "email": user.email},
    )


def _make_refresh_token(user: User) -> str:
    settings = get_settings()
    raw = create_refresh_token(identity=str(user.id))
    token_hash = _hash_token(raw)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_REFRESH_TOKEN_EXPIRES)

    stored = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        created_at=datetime.now(timezone.utc),
    )
    db.session.add(stored)
    db.session.commit()
    return raw


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
