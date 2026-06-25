from marshmallow import Schema, fields, validate
import enum as _enum


def _enum_val(v):
    return v.value if isinstance(v, _enum.Enum) else v


class FavoriteMetaSchema(Schema):
    max_slots = fields.Integer()
    used_slots = fields.Integer()
    available_slots = fields.Integer()
    is_favorited_by_me = fields.Boolean()


class PartImageSchema(Schema):
    id = fields.Method("get_id")
    public_url = fields.String(attribute="asset.public_url")
    position = fields.Integer()
    is_primary = fields.Boolean()

    def get_id(self, obj) -> str:
        return str(obj.id)


class CarGenerationBriefSchema(Schema):
    id = fields.UUID()
    name = fields.String()
    year_from = fields.Integer(allow_none=True)
    year_to = fields.Integer(allow_none=True)
    model_name = fields.String(attribute="model.name")
    make_name = fields.String(attribute="model.make.name")


class CategoryBriefSchema(Schema):
    id = fields.UUID()
    name = fields.String()
    slug = fields.String()


class PartPublicSchema(Schema):
    id = fields.UUID()
    title = fields.String()
    slug = fields.String()
    description = fields.String(allow_none=True)
    oem_number = fields.String(allow_none=True)
    sku = fields.String(allow_none=True)
    price_kzt = fields.Float()
    stock = fields.Integer()
    condition = fields.Method("get_condition")
    status = fields.Method("get_status")

    def get_condition(self, obj): return _enum_val(obj.condition)
    def get_status(self, obj): return _enum_val(obj.status)
    weight_kg = fields.Float(allow_none=True)
    contact_phone = fields.String(allow_none=True)
    priority = fields.Integer()
    category = fields.Nested(CategoryBriefSchema)
    images = fields.List(fields.Nested(PartImageSchema))
    car_generations = fields.List(fields.Nested(CarGenerationBriefSchema))
    favorite_meta = fields.Nested(FavoriteMetaSchema, allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()


class PartListItemSchema(Schema):
    id = fields.UUID()
    title = fields.String()
    slug = fields.String()
    price_kzt = fields.Float()
    stock = fields.Integer()
    condition = fields.Method("get_condition")
    status = fields.Method("get_status")
    category = fields.Nested(CategoryBriefSchema)
    images = fields.List(fields.Nested(PartImageSchema))
    priority = fields.Integer()
    created_at = fields.DateTime()

    def get_condition(self, obj): return _enum_val(obj.condition)
    def get_status(self, obj): return _enum_val(obj.status)


class PartCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=500))
    category_id = fields.UUID(required=True)
    description = fields.String(load_default=None)
    oem_number = fields.String(load_default=None, validate=validate.Length(max=100))
    sku = fields.String(load_default=None, validate=validate.Length(max=100))
    price_kzt = fields.Float(required=True, validate=validate.Range(min=0))
    stock = fields.Integer(load_default=0, validate=validate.Range(min=0))
    condition = fields.String(
        load_default="good",
        validate=validate.OneOf(["good", "fair", "poor"])
    )
    status = fields.String(
        load_default="draft",
        validate=validate.OneOf(["active", "sold_out", "draft", "archived"])
    )
    weight_kg = fields.Float(load_default=None, allow_none=True)
    contact_phone = fields.String(load_default=None, allow_none=True, validate=validate.Length(max=20))
    priority = fields.Integer(load_default=2, validate=validate.OneOf([1, 2, 3, 4]))
    generation_ids = fields.List(fields.UUID(), load_default=[])


class PartUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=500))
    category_id = fields.UUID()
    description = fields.String(allow_none=True)
    oem_number = fields.String(allow_none=True, validate=validate.Length(max=100))
    sku = fields.String(allow_none=True, validate=validate.Length(max=100))
    price_kzt = fields.Float(validate=validate.Range(min=0))
    stock = fields.Integer(validate=validate.Range(min=0))
    condition = fields.String(validate=validate.OneOf(["good", "fair", "poor"]))
    status = fields.String(validate=validate.OneOf(["active", "sold_out", "draft", "archived"]))
    weight_kg = fields.Float(allow_none=True)
    contact_phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    priority = fields.Integer(validate=validate.OneOf([1, 2, 3, 4]))
    generation_ids = fields.List(fields.UUID())
