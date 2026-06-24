from flask import Blueprint, jsonify, Response
from app.extensions import db
from app.models.user import User

bp = Blueprint("setup", __name__, url_prefix="/api/v1/setup")


@bp.post("/create-admin")
def create_admin() -> tuple[Response, int]:
    existing = db.session.execute(
        db.select(User).where(User.email == "admin@jomart")
    ).scalar_one_or_none()
    if existing:
        return jsonify({"error": "Админ уже существует"}), 400

    user = User(email="admin@jomart", role="admin")
    user.set_password("Ggg123ddd@")
    db.session.add(user)
    db.session.commit()
    return jsonify({"ok": True, "email": "admin@jomart"}), 201
