# backend/src/config/settings.py
from pydantic import Field
from pydantic_settings import BaseSettings
from pathlib import Path
from tempfile import gettempdir


class APIConfig(BaseSettings):
    APP_NAME: str = Field("WhaleIdentificationAPI", description="Название приложения")
    APP_DESCRIPTION: str = Field(
        "Автоматическая идентификация китов",
        description="Краткое описание функционала API",
    )
    APP_VERSION: str = Field(
        "0.0.1",
        description="Текущая версия API. Используется для документации и контроля версий.",
    )
    APP_API_PREFIX: str = Field(
        "/api",
        description="Базовый URL-префикс для всех API-эндпоинтов"
    )

    DEBUG: bool = Field(True, description="Флаг режима отладки")

    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:1420"],
        description="Разрешенные CORS origins для API запросов",
    )

    MAX_FILE_SIZE: int = Field(
        default=1024 * 1024 * 500,
        description="Максимальный размер загружаемого файла в байтах",
    )

    def get_production_config(self):
        if self.DEBUG:
            return {}

        return {
            "docs_url": None,
            "redoc_url": None,
            "openapi_url": None,
        }


class DatabaseConfig(BaseSettings):
    DB_HOST: str = Field("localhost", description="PostgreSQL host")
    DB_PORT: int = Field(5432, description="PostgreSQL port")
    DB_USER: str = Field("postgres", description="PostgreSQL user")
    DB_PASSWORD: str = Field("postgres", description="PostgreSQL password")
    DB_NAME: str = Field("whale_identification", description="PostgreSQL database name")

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


class Settings(BaseSettings):
    api: APIConfig = APIConfig()
    db: DatabaseConfig = DatabaseConfig()


settings = Settings()
