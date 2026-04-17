import sentry_sdk
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.api.main import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
        sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Set all CORS enabled origins
    if settings.all_cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.all_cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/health")
    async def health_check():
        """Вернуть статус работоспособности для мониторинга.

        :return: Словарь со статусом сервиса.
        :rtype: Dict
        """
        return {"status": "ok", "message": "Service is running"}

    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app


app = create_app()
