# Backend Refactoring Design

**Date:** 2026-04-17
**Author:** Claude Code
**Branch:** feature/auth → main

## Overview

Полный рефакторинг backend-архитектуры с переходом на PostgreSQL, миграциями Alembic и новой структурой проекта.

## Architecture

Структура `backend/src/` разделена на слои:
- `api/v1/routes/` — FastAPI endpoint'ы
- `schemas/` — Pydantic модели запросов/ответов
- `models/` — SQLAlchemy ORM модели
- `core/` — конфигурация, зависимости, работа с БД
- `config/` — настройки приложения

`backend/migrations/` — Alembic миграции.

## Components

### API Layer
- `api/v1/routes/auth.py` — auth endpoints (register, login, me, refresh)
- APIRouter с префиксом `/api/v1`

### Schemas
- `schemas/auth.py` — RegistrationRequestModel, LoginRequestModel, TokensModel, UserResponseModel, RefreshRequest

### Models
- `models/user.py` — User ORM модель

### Core
- `core/database.py` — Base declarative class, async engine, sessionmaker, get_db dependency
- `core/security.py` — PasswordHash, TokenService

### Config
- `config/settings.py` — Settings с PostgreSQL конфигурацией через переменные окружения

## Data Flow

1. HTTP запрос → FastAPI endpoint
2. Dependency injection для db сессии (`get_db`)
3. Валидация через Pydantic схемы
4. ORM операции с моделями
5. Asyncpg драйвер для PostgreSQL

## Error Handling

- HTTPException (401, 409, 422)
- Pydantic ValidationError
- SQLAlchemyError для ошибок БД
- Логирование через `utils/logger.py`
- Консистентные JSON ответы

## Database

**Только PostgreSQL** — поддержка SQLite удалена.

**Connection string:** `postgresql+asyncpg://user:password@host:port/db`

**Миграции:** Alembic в `backend/migrations/`

## Testing

- `tests/integration/` — интеграционные тесты
- `tests/unit/` — unit тесты
- pytest + pytest-asyncio
- Test database через environment variable

## Directory Structure

```
backend/
├── src/
│   ├── api/
│   │   └── v1/
│   │       └── routes/
│   │           └── auth.py
│   ├── schemas/
│   │   └── auth.py
│   ├── models/
│   │   └── user.py
│   ├── core/
│   │   ├── database.py
│   │   └── security.py
│   └── config/
│       └── settings.py
├── migrations/
├── tests/
├── main.py
└── requirements.txt
```
