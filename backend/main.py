from argparse import ArgumentParser
from os import getenv

from auth.auth import auth_router
from config import settings
from db.Database import Database
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pwdlib import PasswordHash

from backend.utils.logger import logger

load_dotenv()


API_PREFIX = getenv("API_PREFIX", "/")


def create_app() -> FastAPI:
    logger.debug(f"Application settings: \n{settings.model_dump_json(indent=4)}")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.password_hash = PasswordHash.recommended()

        parser = ArgumentParser("Database configuration parser")
        parser.add_argument("--sync", action="store_true")
        parser.add_argument("--reset", action="store_true")
        parser.add_argument("--detail", action="store_true")

        args, _ = parser.parse_known_args()
        is_sync, reset, detail = args.sync, args.reset, args.detail

        app.state.db = Database(is_sync=is_sync, detail=detail)

        if reset:
            await app.state.db.reset()
            logger.info("Database reset successfully")

        logger.info("Database initialized successfully")

        yield

        app.state.db.close()
        logger.info("Database closed successfully")

    app = FastAPI(
        **settings.api.get_production_config(),
        title=settings.api.APP_NAME,
        description=settings.api.APP_DESCRIPTION,
        version=settings.api.APP_VERSION,
        root_path=settings.api.APP_API_PREFIX,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api.CORS_ORIGINS,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health_check() -> Dict:
        """Вернуть статус работоспособности для мониторинга.

        :return: Словарь со статусом сервиса.
        :rtype: Dict
        """
        return {"status": "ok", "message": "Service is running"}

    logger.debug(f"Registering auth_router with base path: {API_PREFIX}")
    app.include_router(auth_router, prefix=API_PREFIX)

    return app


app = create_app()
