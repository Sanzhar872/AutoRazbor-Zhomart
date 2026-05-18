from marshmallow import Schema, fields, validate


class CategorySchema(Schema):
    id = fields.UUID()
    name = fields.String()
    slug = fields.String()
    icon_url = fields.String(allow_none=True)
    sort_order = fields.Integer()
    parent_id = fields.UUID(allow_none=True)
    children = fields.List(fields.Nested(lambda: CategorySchema()))


class CategoryCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    parent_id = fields.UUID(load_default=None)
    icon_url = fields.String(load_default=None)
    sort_order = fields.Integer(load_default=0)


class CategoryUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    parent_id = fields.UUID(allow_none=True)
    icon_url = fields.String(allow_none=True)
    sort_order = fields.Integer()
