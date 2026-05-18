from flask import Flask, jsonify, Response
from werkzeug.exceptions import HTTPException


class AppError(Exception):
    status_code = 400
    error_type = "https://avtorazbor.kz/errors/bad-request"
    title = "Bad Request"

    def __init__(self, detail: str, **extra: object) -> None:
        super().__init__(detail)
        self.detail = detail
        self.extra = extra

    def to_dict(self) -> dict:
        return {
            "type": self.error_type,
            "title": self.title,
            "status": self.status_code,
            "detail": self.detail,
            **self.extra,
        }


class NotFoundError(AppError):
    status_code = 404
    error_type = "https://avtorazbor.kz/errors/not-found"
    title = "Not Found"


class UnauthorizedError(AppError):
    status_code = 401
    error_type = "https://avtorazbor.kz/errors/unauthorized"
    title = "Unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    error_type = "https://avtorazbor.kz/errors/forbidden"
    title = "Forbidden"


class ConflictError(AppError):
    status_code = 409
    error_type = "https://avtorazbor.kz/errors/conflict"
    title = "Conflict"


class ValidationError(AppError):
    status_code = 422
    error_type = "https://avtorazbor.kz/errors/validation"
    title = "Validation Error"


class FavoriteSlotError(AppError):
    status_code = 422
    error_type = "https://avtorazbor.kz/errors/favorite-slot-full"
    title = "Все слоты избранного заняты"


class AlreadyFavoritedError(ConflictError):
    error_type = "https://avtorazbor.kz/errors/already-favorited"
    title = "Уже в избранном"


class PartNotAvailableError(AppError):
    status_code = 400
    error_type = "https://avtorazbor.kz/errors/part-not-available"
    title = "Запчасть недоступна"


class StockUnderflowError(AppError):
    status_code = 400
    error_type = "https://avtorazbor.kz/errors/stock-underflow"
    title = "Остаток не может быть отрицательным"


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(AppError)
    def handle_app_error(e: AppError) -> tuple[Response, int]:
        return jsonify(e.to_dict()), e.status_code

    @app.errorhandler(HTTPException)
    def handle_http(e: HTTPException) -> tuple[Response, int]:
        return jsonify({
            "type": f"https://avtorazbor.kz/errors/http-{e.code}",
            "title": e.name,
            "status": e.code,
            "detail": e.description,
        }), e.code or 500

    @app.errorhandler(Exception)
    def handle_generic(e: Exception) -> tuple[Response, int]:
        app.logger.exception("Unhandled exception")
        return jsonify({
            "type": "https://avtorazbor.kz/errors/internal",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "Внутренняя ошибка сервера",
        }), 500
