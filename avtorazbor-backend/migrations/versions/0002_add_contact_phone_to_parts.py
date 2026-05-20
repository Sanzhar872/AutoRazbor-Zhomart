"""Add contact_phone to parts

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("parts", sa.Column("contact_phone", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("parts", "contact_phone")
