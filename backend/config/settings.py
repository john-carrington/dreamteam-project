from pathlib import Path
from tempfile import gettempdir
from typing import List

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


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
        "/api", description="Базовый URL-префикс для всех API-эндпоинтов"
    )

    TEMP_DIR: str = Field(
        default_factory=lambda: str(Path(gettempdir()) / "whale_identification"),
        description="Директория для хранения временных файлов",
    )

    DEBUG: bool = Field(True, description="Флаг режима отладки")

    ALLOWED_CONTENT_TYPES: List[str] = [
        "video/mp4",
        "video/mpeg",
        "video/webm",
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/bmp",
    ]

    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:1420"],
        description="Разрешенные CORS origins для API запросов",
    )

    MAX_FILE_SIZE: int = Field(
        default=1024 * 1024 * 500,  # 500 MB
        description="Максимальный размер загружаемого файла в байтах",
    )

    def get_temp_dir(self):
        """Получить и вернуть временную директорию как объект Path.

        :return: Путь к временной директории.
        :rtype: Path
        """
        return Path(self.TEMP_DIR)

    def get_production_config(self):
        """Вернуть конфигурацию для продакшен-режима.

        Возвращает пустой словарь для режима отладки (документация включена)
        или словарь с отключённой документацией для продакшен-режима.

        :return: Словарь конфигурации продакшен-режима.
        :rtype: dict
        """
        if self.DEBUG:
            return {}

        return {
            "docs_url": None,
            "redoc_url": None,
            "openapi_url": None,
        }


class SQLDataBaseConfig(BaseSettings):
    DB_FILE_PATH: str = Field("./local_data.db", description="Имя базы данных")

    def get_database_url(self):
        """Вернуть URL базы данных SQLAlchemy.

        :return: URL базы данных.
        :rtype: str
        """
        return f"sqlite+aiosqlite:///{self.DB_FILE_PATH}"


class Config(BaseSettings):
    api: APIConfig = APIConfig()
    db: SQLDataBaseConfig = SQLDataBaseConfig()


settings = Config()
