from marshmallow import Schema, fields, validate, validates, ValidationError as MaValidationError


class UserCreateSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=8, max=128))
    full_name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    phone = fields.String(load_default=None, validate=validate.Length(max=20))


class UserLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)


class UserPublicSchema(Schema):
    id = fields.UUID(dump_default=None)
    email = fields.Email()
    full_name = fields.String()
    phone = fields.String(allow_none=True)
    role = fields.Method("get_role")
    created_at = fields.DateTime()

    def get_role(self, obj):
        return obj.role.value if hasattr(obj.role, 'value') else obj.role


class UserAdminSchema(UserPublicSchema):
    is_active = fields.Boolean()
    last_login_at = fields.DateTime(allow_none=True)
    updated_at = fields.DateTime()


class UserUpdateSchema(Schema):
    full_name = fields.String(validate=validate.Length(min=1, max=200))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))


class ChangePasswordSchema(Schema):
    current_password = fields.String(required=True, load_only=True)
    new_password = fields.String(
        required=True, load_only=True, validate=validate.Length(min=8, max=128)
    )
