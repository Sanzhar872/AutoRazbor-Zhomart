import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, Response, send_from_directory, current_app
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.media import MediaAsset
from app.permissions import require_role
from app.errors import ValidationError
from app.config import get_settings

bp = Blueprint("media", __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


def _ensure_upload_dir() -> str:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    return UPLOAD_FOLDER


@bp.post("/api/v1/media/upload")
@require_role("admin")
def upload() -> tuple[Response, int]:
    settings = get_settings()

    if "file" not in request.files:
        raise ValidationError("Файл не передан")

    file = request.files["file"]
    if not file.filename:
        raise ValidationError("Пустое имя файла")

    mime = file.mimetype or "application/octet-stream"
    if mime not in settings.allowed_mime_types_list:
        raise ValidationError(f"Недопустимый тип файла: {mime}")

    content = file.read()
    if len(content) > settings.MAX_UPLOAD_BYTES:
        raise ValidationError(f"Файл слишком большой (макс. {settings.MAX_UPLOAD_BYTES // 1024 // 1024} МБ)")

    ext = os.path.splitext(secure_filename(file.filename))[1].lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    folder = _ensure_upload_dir()
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    public_url = f"/uploads/{filename}"

    asset = MediaAsset(
        gcs_path=f"local/{filename}",
        public_url=public_url,
        mime_type=mime,
        size_bytes=len(content),
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    db.session.add(asset)
    db.session.commit()

    return jsonify({
        "id": str(asset.id),
        "public_url": public_url,
        "mime_type": mime,
        "size_bytes": len(content),
    }), 201


@bp.get("/uploads/<filename>")
def serve_upload(filename: str) -> Response:
    return send_from_directory(UPLOAD_FOLDER, filename)
