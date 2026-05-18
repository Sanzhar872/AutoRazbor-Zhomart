from marshmallow import Schema, fields
from app.schemas.part import PartListItemSchema


class FavoriteSchema(Schema):
    id = fields.UUID()
    part = fields.Nested(PartListItemSchema)
    created_at = fields.DateTime()


class FavoriteAddSchema(Schema):
    part_id = fields.UUID(required=True)
