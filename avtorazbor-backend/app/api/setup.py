from flask import Blueprint, jsonify, Response
from sqlalchemy import select
from app.extensions import db
from app.models.user import User
from app.utils.pwhash import hash_password

bp = Blueprint("setup", __name__, url_prefix="/api/v1/setup")


@bp.post("/create-admin")
def create_admin() -> tuple[Response, int]:
    existing = db.session.execute(
        select(User).where(User.email == "admin@jomart")
    ).scalar_one_or_none()
    if existing:
        return jsonify({"error": "Админ уже существует"}), 400

    user = User(email="admin@jomart", role="admin", password_hash=hash_password("Ggg123ddd@"))
    db.session.add(user)
    db.session.commit()
    return jsonify({"ok": True, "email": "admin@jomart"}), 201
