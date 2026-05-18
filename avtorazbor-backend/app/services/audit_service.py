import uuid
from flask import request
from app.extensions import db
from app.models.audit import AuditLog


def log(
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None = None,
    actor_id: uuid.UUID | None = None,
    diff: dict | None = None,
) -> None:
    ip = request.remote_addr if request else None
    entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        diff=diff,
        ip_address=ip,
    )
    db.session.add(entry)
    # committed by caller's transaction
