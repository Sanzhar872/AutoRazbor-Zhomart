"""Cleanup orphaned sales records for deleted parts

Revision ID: 0006
Revises: 0005
Create Date: 2026-06-07
"""
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Удаляем все записи о продажах для удалённых (soft-deleted) товаров
    op.execute("""
        DELETE FROM sales
        WHERE part_id IN (
            SELECT id FROM parts WHERE deleted_at IS NOT NULL
        )
    """)


def downgrade() -> None:
    pass
