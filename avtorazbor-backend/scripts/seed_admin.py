#!/usr/bin/env python
"""
Usage: python scripts/seed_admin.py
Creates an admin user from env vars ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
from app.utils.pwhash import hash_password

app = create_app()

with app.app_context():
    email = os.environ.get("ADMIN_EMAIL", "admin@avtorazbor.kz")
    password = os.environ.get("ADMIN_PASSWORD", "changeme123")
    full_name = os.environ.get("ADMIN_NAME", "Администратор")

    existing = db.session.execute(db.select(User).filter_by(email=email)).scalar_one_or_none()
    if existing:
        print(f"Admin already exists: {email}")
        sys.exit(0)

    admin = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        role=UserRole.admin,
    )
    db.session.add(admin)
    db.session.commit()
    print(f"Admin created: {email}")
