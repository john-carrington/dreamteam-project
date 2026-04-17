# backend/main.py
from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.core.database import init_db
from src.api.v1.routes.auth import auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


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
    """Вернуть статус работоспособности для мониторинга"""
    return {"status": "ok", "message": "Service is running"}


app.include_router(auth_router, prefix="/v1")
