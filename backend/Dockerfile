FROM python:3.12-alpine3.21 AS builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

RUN apk add --no-cache build-base

COPY pyproject.toml .
RUN uv sync --no-cache --no-dev --python 3.12

FROM python:3.12-alpine3.21

WORKDIR /app

COPY --from=builder /app/.venv .venv
ENV PATH="/app/.venv/bin:$PATH"

COPY  . .

COPY entrypoint.sh ./

HEALTHCHECK --interval=1s --timeout=5s --retries=10 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:8000/api/health

EXPOSE 8000

ENTRYPOINT ["sh", "./entrypoint.sh"]

