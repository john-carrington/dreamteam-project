#!/usr/bin/env bash
set -e

# ✅ Убедимся, что корень проекта в PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:/app/backend"

echo "🚀 Starting entrypoint..."

# 🔄 Запустить подготовку БД (только если не скипнуто)
if [[ "${SKIP_PRESTART:-}" != "true" ]]; then
    echo "⏳ Running prestart checks..."
    bash /app/backend/scripts/prestart.sh
fi

# 🎯 Запустить основное приложение (exec заменяет процесс, чтобы ловить сигналы)
echo "🔥 Starting application..."
exec fastapi run --workers 4 app/main.py --port 8000