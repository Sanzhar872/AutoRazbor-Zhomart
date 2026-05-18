from marshmallow import Schema, fields, validate


class CarMakeSchema(Schema):
    id = fields.UUID()
    name = fields.String()
    slug = fields.String()
    logo_url = fields.String(allow_none=True)


class CarModelSchema(Schema):
    id = fields.UUID()
    name = fields.String()
    slug = fields.String()
    make_id = fields.UUID()


class CarGenerationSchema(Schema):
    id = fields.UUID()
    name = fields.String()
    year_from = fields.Integer(allow_none=True)
    year_to = fields.Integer(allow_none=True)
    model_id = fields.UUID()


class CarMakeCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    logo_url = fields.String(load_default=None)


class CarModelCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))


class CarGenerationCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    year_from = fields.Integer(load_default=None)
    year_to = fields.Integer(load_default=None)
