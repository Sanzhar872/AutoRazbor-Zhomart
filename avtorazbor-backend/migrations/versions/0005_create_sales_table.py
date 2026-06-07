"""Create sales table

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sales",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("part_id", UUID(as_uuid=True), sa.ForeignKey("parts.id", ondelete="RESTRICT"), nullable=False),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("price_kzt", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_kzt", sa.Numeric(12, 2), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("returned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("sales_part_idx", "sales", ["part_id"])
    op.create_index("sales_status_idx", "sales", ["status"])
    op.create_index("sales_created_idx", "sales", ["created_at"])


def downgrade() -> None:
    op.drop_index("sales_created_idx")
    op.drop_index("sales_status_idx")
    op.drop_index("sales_part_idx")
    op.drop_table("sales")
