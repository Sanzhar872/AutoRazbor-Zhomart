"""Add deleted_at to audit_log

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-20
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("audit_log", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("audit_deleted_idx", "audit_log", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("audit_deleted_idx", table_name="audit_log")
    op.drop_column("audit_log", "deleted_at")
