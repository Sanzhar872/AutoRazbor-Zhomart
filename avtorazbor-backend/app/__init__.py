import structlog
import logging
from datetime import timedelta
from flask import Flask

from app.config import get_settings
from app.extensions import db, migrate, jwt, cors, limiter
from app.errors import register_error_handlers


def create_app() -> Flask:
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    settings = get_settings()

    # Core config
    app.config["SECRET_KEY"] = settings.SECRET_KEY
    app.config["SQLALCHEMY_DATABASE_URI"] = settings.DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(seconds=settings.JWT_ACCESS_TOKEN_EXPIRES)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(seconds=settings.JWT_REFRESH_TOKEN_EXPIRES)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    origins = settings.cors_origins_list
    # supports_credentials=True is incompatible with wildcard origin
    use_credentials = origins != ["*"]
    cors.init_app(app, resources={r"/api/*": {
        "origins": origins,
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": use_credentials,
        "max_age": 3600,
    }})
    limiter.init_app(app)

    # Logging
    _configure_logging(settings.LOG_LEVEL)

    # Import all models so Alembic sees them
    with app.app_context():
        from . import models  # noqa: F401

    # Blueprints
    from app.api import register_blueprints
    register_blueprints(app)

    # Error handlers
    register_error_handlers(app)

    return app


def _configure_logging(level: str) -> None:
    structlog.configure(
        processors=[
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
    )
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, level.upper(), logging.INFO),
    )
