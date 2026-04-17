#! /usr/bin/env bash

set -e
set -x

# ✅ Добавляем корень проекта в PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:."

# Let the DB start
python app/backend_pre_start.py

# Run migrations
alembic upgrade head

# Create initial data in DB
python app/initial_data.py