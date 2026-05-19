import base64
import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, Response, send_from_directory, current_app
from werkzeug.utils import secure_filename

import cloudinary
import cloudinary.uploader

from app.extensions import db
from app.models.media import MediaAsset
from app.permissions import require_role
from app.errors import ValidationError
from app.config import get_settings

bp = Blueprint("media", __name__)

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"
)


def _cloudinary_enabled() -> bool:
    s = get_settings()
    return bool(s.CLOUDINARY_CLOUD_NAME and s.CLOUDINARY_API_KEY and s.CLOUDINARY_API_SECRET)


def _configure_cloudinary() -> None:
    s = get_settings()
    cloudinary.config(
        cloud_name=s.CLOUDINARY_CLOUD_NAME,
        api_key=s.CLOUDINARY_API_KEY,
        api_secret=s.CLOUDINARY_API_SECRET,
        secure=True,
    )


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
        raise ValidationError(
            f"Файл слишком большой (макс. {settings.MAX_UPLOAD_BYTES // 1024 // 1024} МБ)"
        )

    if _cloudinary_enabled():
        # Upload to Cloudinary — permanent, CDN-served
        _configure_cloudinary()
        try:
            data_uri = f"data:{mime};base64,{base64.b64encode(content).decode()}"
            result = cloudinary.uploader.upload(
                data_uri,
                folder="avtorazbor",
                resource_type="image",
            )
            public_url = result["secure_url"]
            gcs_path = result["public_id"]
        except Exception as e:
            current_app.logger.error(f"Cloudinary upload error: {e}")
            raise ValidationError(f"Ошибка загрузки в облако: {e}")
    else:
        # Fallback: local filesystem (dev only — ephemeral on Render)
        ext = os.path.splitext(secure_filename(file.filename))[1].lower() or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        with open(os.path.join(UPLOAD_FOLDER, filename), "wb") as f:
            f.write(content)
        public_url = f"/uploads/{filename}"
        gcs_path = f"local/{filename}"

    asset = MediaAsset(
        gcs_path=gcs_path,
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
