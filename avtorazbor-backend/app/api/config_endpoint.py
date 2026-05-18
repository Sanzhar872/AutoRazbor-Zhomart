from flask import Blueprint, jsonify, Response
from app.config import get_settings

bp = Blueprint("config", __name__, url_prefix="/api/v1")


@bp.get("/config")
def get_config() -> tuple[Response, int]:
    s = get_settings()
    return jsonify({
        "contact_phone": s.CONTACT_PHONE,
        "contact_phone_display": s.CONTACT_PHONE_DISPLAY,
        "working_hours": s.WORKING_HOURS,
        "address": s.SHOP_ADDRESS,
        "whatsapp_link": f"https://wa.me/{s.WHATSAPP_NUMBER}",
    }), 200
