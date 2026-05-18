"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS citext")
    # ENUMs создаются автоматически через sa.Enum в create_table

    # users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(254), unique=True, nullable=False),
        sa.Column("password_hash", sa.Text, nullable=False),
        sa.Column("full_name", sa.Text, nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("role", sa.Enum("admin", "customer", name="user_role"), nullable=False, server_default="customer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.Text, unique=True, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("rt_user_idx", "refresh_tokens", ["user_id"])

    # car_makes
    op.create_table(
        "car_makes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.Text, unique=True, nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # car_models
    op.create_table(
        "car_models",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("make_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("car_makes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("slug", sa.String(120), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("make_id", "name", name="uq_car_model_make_name"),
    )

    # car_generations
    op.create_table(
        "car_generations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("model_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("car_models.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("year_from", sa.SmallInteger, nullable=True),
        sa.Column("year_to", sa.SmallInteger, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # categories
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("slug", sa.String(120), unique=True, nullable=False),
        sa.Column("icon_url", sa.Text, nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("cat_parent_idx", "categories", ["parent_id"])

    # media_assets
    op.create_table(
        "media_assets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("gcs_path", sa.Text, unique=True, nullable=False),
        sa.Column("public_url", sa.Text, nullable=False),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.BigInteger, nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    # parts
    op.create_table(
        "parts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("category_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("categories.id"), nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("slug", sa.String(200), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("oem_number", sa.String(100), nullable=True),
        sa.Column("sku", sa.String(100), unique=True, nullable=True),
        sa.Column("price_kzt", sa.Numeric(12, 2), nullable=False),
        sa.Column("stock", sa.Integer, nullable=False, server_default="0"),
        sa.Column("condition", sa.Enum("good", "fair", "poor", name="part_condition"), nullable=False, server_default="good"),
        sa.Column("status", sa.Enum("active", "sold_out", "draft", "archived", name="part_status"), nullable=False, server_default="draft"),
        sa.Column("weight_kg", sa.Numeric(6, 2), nullable=True),
        sa.Column("search_vector", postgresql.TSVECTOR, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("stock >= 0", name="ck_parts_stock_non_negative"),
    )
    op.create_index("parts_category_idx", "parts", ["category_id"])
    op.create_index("parts_status_idx", "parts", ["status"])
    op.create_index("parts_stock_idx", "parts", ["stock"])
    op.create_index("parts_oem_idx", "parts", ["oem_number"])
    op.create_index("parts_search_idx", "parts", ["search_vector"], postgresql_using="gin")

    # part_car_models
    op.create_table(
        "part_car_models",
        sa.Column("part_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("parts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("car_generations.id", ondelete="CASCADE"), nullable=False),
        sa.PrimaryKeyConstraint("part_id", "generation_id"),
    )

    # part_images
    op.create_table(
        "part_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("part_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("parts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("asset_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("media_assets.id"), nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_primary", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("pi_part_idx", "part_images", ["part_id", "position"])

    # favorites
    op.create_table(
        "favorites",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("part_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("parts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "part_id", name="uq_favorites_user_part"),
    )
    op.create_index("fav_user_idx", "favorites", ["user_id"])
    op.create_index("fav_part_idx", "favorites", ["part_id"])

    # audit_log
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.Text, nullable=False),
        sa.Column("entity_type", sa.Text, nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("diff", postgresql.JSONB, nullable=True),
        sa.Column("ip_address", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("audit_actor_idx", "audit_log", ["actor_id"])
    op.create_index("audit_entity_idx", "audit_log", ["entity_type", "entity_id"])

    # FTS trigger
    op.execute("""
        CREATE OR REPLACE FUNCTION parts_search_vector_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('russian', coalesce(NEW.title, '')), 'A') ||
            setweight(to_tsvector('russian', coalesce(NEW.description, '')), 'B') ||
            setweight(to_tsvector('simple',  coalesce(NEW.oem_number, '')), 'A') ||
            setweight(to_tsvector('simple',  coalesce(NEW.sku, '')), 'A');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER parts_search_update
          BEFORE INSERT OR UPDATE ON parts
          FOR EACH ROW EXECUTE FUNCTION parts_search_vector_update();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS parts_search_update ON parts")
    op.execute("DROP FUNCTION IF EXISTS parts_search_vector_update()")
    op.drop_table("audit_log")
    op.drop_table("favorites")
    op.drop_table("part_images")
    op.drop_table("part_car_models")
    op.drop_table("parts")
    op.drop_table("media_assets")
    op.drop_table("categories")
    op.drop_table("car_generations")
    op.drop_table("car_models")
    op.drop_table("car_makes")
    op.drop_table("refresh_tokens")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS part_status")
    op.execute("DROP TYPE IF EXISTS part_condition")
    op.execute("DROP TYPE IF EXISTS user_role")
