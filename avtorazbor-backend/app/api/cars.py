import uuid
from flask import Blueprint, jsonify, request, Response
from marshmallow import ValidationError as MaValidationError
from sqlalchemy import select

from app.extensions import db
from app.models.car import CarMake, CarModel, CarGeneration
from app.schemas.car import (
    CarMakeSchema, CarModelSchema, CarGenerationSchema,
    CarMakeCreateSchema, CarModelCreateSchema, CarGenerationCreateSchema,
)
from app.services.slug_service import make_unique_slug
from app.permissions import require_role
from app.errors import NotFoundError, ValidationError

bp = Blueprint("cars", __name__, url_prefix="/api/v1/cars")


@bp.get("/makes")
def list_makes() -> tuple[Response, int]:
    makes = list(db.session.execute(select(CarMake).order_by(CarMake.name)).scalars())
    return jsonify(CarMakeSchema(many=True).dump(makes)), 200


@bp.post("/makes")
@require_role("admin")
def create_make() -> tuple[Response, int]:
    try:
        data = CarMakeCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    slug = make_unique_slug(data["name"], "car_makes")
    make = CarMake(name=data["name"], slug=slug, logo_url=data.get("logo_url"))
    db.session.add(make)
    db.session.commit()
    return jsonify(CarMakeSchema().dump(make)), 201


@bp.get("/makes/<make_id>/models")
def list_models(make_id: str) -> tuple[Response, int]:
    make = db.session.get(CarMake, uuid.UUID(make_id))
    if not make:
        raise NotFoundError("Марка не найдена")
    models = list(db.session.execute(
        select(CarModel).where(CarModel.make_id == make.id).order_by(CarModel.name)
    ).scalars())
    return jsonify(CarModelSchema(many=True).dump(models)), 200


@bp.post("/makes/<make_id>/models")
@require_role("admin")
def create_model(make_id: str) -> tuple[Response, int]:
    make = db.session.get(CarMake, uuid.UUID(make_id))
    if not make:
        raise NotFoundError("Марка не найдена")
    try:
        data = CarModelCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    slug = make_unique_slug(f"{make.name}-{data['name']}", "car_models")
    model = CarModel(make_id=make.id, name=data["name"], slug=slug)
    db.session.add(model)
    db.session.commit()
    return jsonify(CarModelSchema().dump(model)), 201


@bp.get("/models/<model_id>/generations")
def list_generations(model_id: str) -> tuple[Response, int]:
    model = db.session.get(CarModel, uuid.UUID(model_id))
    if not model:
        raise NotFoundError("Модель не найдена")
    gens = list(db.session.execute(
        select(CarGeneration).where(CarGeneration.model_id == model.id).order_by(CarGeneration.year_from)
    ).scalars())
    return jsonify(CarGenerationSchema(many=True).dump(gens)), 200


@bp.post("/models/<model_id>/generations")
@require_role("admin")
def create_generation(model_id: str) -> tuple[Response, int]:
    model = db.session.get(CarModel, uuid.UUID(model_id))
    if not model:
        raise NotFoundError("Модель не найдена")
    try:
        data = CarGenerationCreateSchema().load(request.get_json() or {})
    except MaValidationError as e:
        raise ValidationError(str(e.messages))
    gen = CarGeneration(
        model_id=model.id,
        name=data["name"],
        year_from=data.get("year_from"),
        year_to=data.get("year_to"),
    )
    db.session.add(gen)
    db.session.commit()
    return jsonify(CarGenerationSchema().dump(gen)), 201
