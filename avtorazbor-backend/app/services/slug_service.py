from slugify import slugify
from sqlalchemy import text
from app.extensions import db


def make_unique_slug(title: str, table: str, existing_id: object = None) -> str:
    base = slugify(title, allow_unicode=False, max_length=190)
    slug = base
    counter = 1

    while True:
        sql = f"SELECT id FROM {table} WHERE slug = :slug"
        row = db.session.execute(text(sql), {"slug": slug}).first()
        if row is None or (existing_id and str(row[0]) == str(existing_id)):
            return slug
        slug = f"{base}-{counter}"
        counter += 1
