from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Flask
    FLASK_ENV: str = "development"
    SECRET_KEY: str = "change-me-in-production"
    LOG_LEVEL: str = "INFO"

    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/avtorazbor"

    # JWT
    JWT_SECRET_KEY: str = "change-me-jwt-secret"
    JWT_ACCESS_TOKEN_EXPIRES: int = 900       # 15 min
    JWT_REFRESH_TOKEN_EXPIRES: int = 2592000  # 30 days

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # GCS
    GCS_BUCKET_NAME: str = "avtorazbor-media"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""

    # Contact info (returned by /api/v1/config)
    CONTACT_PHONE: str = "+70000000000"
    CONTACT_PHONE_DISPLAY: str = "8 (000) 000-00-00"
    WORKING_HOURS: str = "Пн–Сб 9:00–18:00"
    SHOP_ADDRESS: str = "г. Алматы"
    WHATSAPP_NUMBER: str = "70000000000"

    # Media
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ALLOWED_MIME_TYPES: str = "image/jpeg,image/png,image/webp"

    # Rate limits
    RATE_LIMIT_AUTH: str = "5 per minute"
    RATE_LIMIT_SEARCH: str = "30 per minute"
    RATE_LIMIT_FAVORITES: str = "20 per minute"

    @field_validator("CORS_ORIGINS")
    @classmethod
    def split_origins(cls, v: str) -> str:
        return v  # kept as string, parsed in create_app

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [m.strip() for m in self.ALLOWED_MIME_TYPES.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
