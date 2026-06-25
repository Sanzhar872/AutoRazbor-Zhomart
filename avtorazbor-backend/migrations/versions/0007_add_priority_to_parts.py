"""add priority to parts

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-25
"""
from alembic import op
import sqlalchemy as sa

revision = '0007'
down_revision = '0006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('parts', sa.Column('priority', sa.Integer(), nullable=False, server_default='2'))
    op.create_index('parts_priority_idx', 'parts', ['priority'])


def downgrade():
    op.drop_index('parts_priority_idx', 'parts')
    op.drop_column('parts', 'priority')
