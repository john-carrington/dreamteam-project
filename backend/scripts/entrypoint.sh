#!/usr/bin/env bash
set -e

export PYTHONPATH="${PYTHONPATH}:/app/backend"

echo "🚀 Starting entrypoint..."

if [[ "${SKIP_PRESTART:-}" != "true" ]]; then
    echo "⏳ Running prestart checks..."
    bash /app/backend/scripts/prestart.sh
fi


WORKERS="${WORKERS:-4}"
WORKER_CLASS="${WORKER_CLASS:-uvicorn.workers.UvicornWorker}"
BIND="${BIND:-0.0.0.0:8000}"
LOG_LEVEL="${LOG_LEVEL:-info}"

exec gunicorn "app.main:app" \
    --workers "$WORKERS" \
    --worker-class "$WORKER_CLASS" \
    --bind "$BIND" \
    --log-level "$LOG_LEVEL" \