from flask import Blueprint, jsonify
from sqlalchemy import text
from app.extensions import db

bp = Blueprint("health", __name__)


@bp.get("/healthz")
def liveness():
    return jsonify({"status": "ok"})


@bp.get("/readyz")
def readiness():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify({"status": "ok", "db": "ok"})
    except Exception as e:
        return jsonify({"status": "error", "db": str(e)}), 503
