"""Add search_vector trigger and backfill

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-03
"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION parts_search_vector_update() RETURNS trigger AS $$
        BEGIN
            NEW.search_vector := to_tsvector('russian',
                coalesce(NEW.title, '') || ' ' ||
                coalesce(NEW.description, '') || ' ' ||
                coalesce(NEW.oem_number, '')
            );
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        DROP TRIGGER IF EXISTS parts_search_vector_trigger ON parts;
        CREATE TRIGGER parts_search_vector_trigger
        BEFORE INSERT OR UPDATE OF title, description, oem_number
        ON parts
        FOR EACH ROW EXECUTE FUNCTION parts_search_vector_update();
    """)

    op.execute("""
        UPDATE parts SET search_vector = to_tsvector('russian',
            coalesce(title, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(oem_number, '')
        );
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS parts_search_vector_trigger ON parts;")
    op.execute("DROP FUNCTION IF EXISTS parts_search_vector_update;")
