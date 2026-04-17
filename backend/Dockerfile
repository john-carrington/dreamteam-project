# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1: base — общий слой с uv и переменными окружения
# ==============================================================================
FROM python:3.10-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# ==============================================================================
# Stage 2: builder — установка зависимостей и сборка проекта
# ==============================================================================
FROM base AS builder

WORKDIR /app/

# Сначала только файлы для разрешения зависимостей — слой кешируется
# до изменения pyproject.toml / uv.lock
COPY pyproject.toml ./

# Устанавливаем только зависимости (без самого пакета)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-workspace --no-dev --package app

# Копируем исходный код
COPY alembic.ini ./
COPY app/ ./app/
COPY scripts/ ./scripts/

# Финальная синхронизация с установкой пакета
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-dev --package app

# ==============================================================================
# Stage 3: production — минимальный финальный образ
# ==============================================================================
FROM python:3.10-slim AS production

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Создаём непривилегированного пользователя
RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid appgroup --shell /bin/sh --create-home appuser

WORKDIR /app/backend/

# Копируем только собранный venv и исходники — без uv, кешей, build-мусора
COPY --from=builder --chown=appuser:appgroup /app/.venv /app/.venv
COPY --from=builder --chown=appuser:appgroup /app/app ./app/
COPY --from=builder --chown=appuser:appgroup /app/alembic.ini ./
COPY --from=builder --chown=appuser:appgroup /app/scripts ./scripts/

USER appuser

EXPOSE 8000

# Healthcheck — важен для оркестраторов (k8s, ECS, Docker Swarm)
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["fastapi", "run", "--workers", "4", "app/main.py", "--port", "8000"]