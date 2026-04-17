# Backend Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Полный рефакторинг backend-архитектуры с переходом на PostgreSQL и миграциями Alembic

**Architecture:** Чистая слоистая архитектура с разделением на routes, schemas, models, core, config. Асинхронный доступ к PostgreSQL через asyncpg. Dependency injection для базы данных.

**Tech Stack:** FastAPI, SQLAlchemy (async), asyncpg, Alembic, Pydantic, pytest, pytest-asyncio

---

## File Structure

### Создание:
- `backend/src/api/v1/routes/auth.py` — auth endpoints
- `backend/src/schemas/auth.py` — Pydantic схемы
- `backend/src/models/user.py` — User ORM модель
- `backend/src/core/database.py` — база данных и зависимости
- `backend/src/core/security.py` — PasswordHash, TokenService
- `backend/src/config/settings.py` — настройки
- `backend/requirements.txt` — зависимости
- `backend/.env.example` — пример переменных окружения
- `backend/alembic.ini` — конфигурация Alembic
- `backend/migrations/env.py` — окружение миграций
- `backend/migrations/versions/` — файлы миграций
- `backend/tests/conftest.py` — pytest fixtures
- `backend/tests/integration/test_auth.py` — интеграционные тесты
- `backend/tests/unit/test_security.py` — unit тесты

### Модификация:
- `backend/main.py` — обновление импортов и структуры

### Удаление:
- `backend/auth/` — старый auth модуль
- `backend/db/` — старый database модуль
- `backend/config/__init__.py` — старый init
- `backend/utils/` — если не используется

---

### Task 1: Создание структуры директорий

**Files:**
- Create: `backend/src/api/v1/routes/`
- Create: `backend/src/schemas/`
- Create: `backend/src/models/`
- Create: `backend/src/core/`
- Create: `backend/src/config/`
- Create: `backend/migrations/versions/`
- Create: `backend/tests/integration/`
- Create: `backend/tests/unit/`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p backend/src/api/v1/routes
mkdir -p backend/src/schemas
mkdir -p backend/src/models
mkdir -p backend/src/core
mkdir -p backend/src/config
mkdir -p backend/migrations/versions
mkdir -p backend/tests/integration
mkdir -p backend/tests/unit
```

- [ ] **Step 2: Verify directories created**

Run: `ls -la backend/src/`
Expected: Output showing api, models, schemas, core, config directories

Run: `ls -la backend/migrations/`
Expected: Output showing versions directory

- [ ] **Step 3: Commit**

```bash
git add backend/
git commit -m "chore: create new directory structure for refactoring"
```

---

### Task 2: Настройки PostgreSQL

**Files:**
- Create: `backend/src/config/settings.py`
- Create: `backend/.env.example`

- [ ] **Step 1: Write PostgreSQL settings**

```python
# backend/src/config/settings.py
from pydantic import Field
from pydantic_settings import BaseSettings
from pathlib import Path
from tempfile import gettempdir


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
        "/api",
        description="Базовый URL-префикс для всех API-эндпоинтов"
    )

    DEBUG: bool = Field(True, description="Флаг режима отладки")

    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:1420"],
        description="Разрешенные CORS origins для API запросов",
    )

    MAX_FILE_SIZE: int = Field(
        default=1024 * 1024 * 500,
        description="Максимальный размер загружаемого файла в байтах",
    )

    def get_production_config(self):
        if self.DEBUG:
            return {}

        return {
            "docs_url": None,
            "redoc_url": None,
            "openapi_url": None,
        }


class DatabaseConfig(BaseSettings):
    DB_HOST: str = Field("localhost", description="PostgreSQL host")
    DB_PORT: int = Field(5432, description="PostgreSQL port")
    DB_USER: str = Field("postgres", description="PostgreSQL user")
    DB_PASSWORD: str = Field("postgres", description="PostgreSQL password")
    DB_NAME: str = Field("whale_identification", description="PostgreSQL database name")

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


class Settings(BaseSettings):
    api: APIConfig = APIConfig()
    db: DatabaseConfig = DatabaseConfig()


settings = Settings()
```

- [ ] **Step 2: Write .env.example**

```bash
# backend/.env.example
# API Settings
DEBUG=True
CORS_ORIGINS=["http://localhost:5173","http://localhost:1420"]

# Database Settings
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=whale_identification
```

- [ ] **Step 3: Create empty __init__ files**

```bash
touch backend/src/config/__init__.py
touch backend/src/core/__init__.py
touch backend/src/models/__init__.py
touch backend/src/schemas/__init__.py
touch backend/src/api/__init__.py
touch backend/src/api/v1/__init__.py
touch backend/src/api/v1/routes/__init__.py
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/config/settings.py backend/.env.example
git add backend/src/config/__init__.py backend/src/core/__init__.py
git add backend/src/models/__init__.py backend/src/schemas/__init__.py
git add backend/src/api/__init__.py backend/src/api/v1/__init__.py backend/src/api/v1/routes/__init__.py
git commit -m "feat: add PostgreSQL settings configuration"
```

---

### Task 3: ORM модель User

**Files:**
- Create: `backend/src/models/user.py`
- Modify: `backend/src/models/__init__.py`

- [ ] **Step 1: Write User model**

```python
# backend/src/models/user.py
from sqlalchemy import String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    surname: Mapped[str] = mapped_column(String(100))
    is_admin: Mapped[bool] = mapped_column(default=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(tz=timezone.utc))
```

- [ ] **Step 2: Update models __init__**

```python
# backend/src/models/__init__.py
from src.models.user import Base, User

__all__ = ["Base", "User"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/
git commit -m "feat: add User ORM model"
```

---

### Task 4: Pydantic схемы

**Files:**
- Create: `backend/src/schemas/auth.py`

- [ ] **Step 1: Write auth schemas**

```python
# backend/src/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    surname: str = Field(..., min_length=1, max_length=100)


class UserResponseModel(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RegistrationRequestModel(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class LoginRequestModel(BaseModel):
    email: EmailStr
    password: str


class TokensModel(BaseModel):
    access_token: str
    refresh_token: str


class RefreshRequest(BaseModel):
    refresh_token: str
```

- [ ] **Step 2: Update schemas __init__**

```python
# backend/src/schemas/__init__.py
from src.schemas.auth import (
    UserResponseModel,
    RegistrationRequestModel,
    LoginRequestModel,
    TokensModel,
    RefreshRequest,
)

__all__ = [
    "UserResponseModel",
    "RegistrationRequestModel",
    "LoginRequestModel",
    "TokensModel",
    "RefreshRequest",
]
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/schemas/
git commit -m "feat: add auth request/response schemas"
```

---

### Task 5: Database и зависимости

**Files:**
- Create: `backend/src/core/database.py`

- [ ] **Step 1: Write database configuration**

```python
# backend/src/core/database.py
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from typing import AsyncGenerator

from src.models import Base
from src.config.settings import settings


engine = create_async_engine(
    settings.db.database_url,
    echo=settings.api.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """Инициализация базы данных - создание всех таблиц"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency для получения сессии базы данных"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

- [ ] **Step 2: Update core __init__**

```python
# backend/src/core/__init__.py
from src.core.database import engine, AsyncSessionLocal, init_db, get_db

__all__ = ["engine", "AsyncSessionLocal", "init_db", "get_db"]
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/core/database.py backend/src/core/__init__.py
git commit -m "feat: add database configuration and dependency injection"
```

---

### Task 6: Security и токены

**Files:**
- Create: `backend/src/core/security.py`

- [ ] **Step 1: Write security module**

```python
# backend/src/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from pwdlib import PasswordHash
from pydantic import BaseModel


class TokenPayload(BaseModel):
    sub: str
    exp: datetime


class TokenService:
    SECRET_KEY = "your-secret-key-change-in-production"
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7

    @classmethod
    def create_token(cls, email: str, expire_minutes: int) -> str:
        expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
        payload = TokenPayload(sub=email, exp=expire)
        return jwt.encode(payload.model_dump(), cls.SECRET_KEY, algorithm=cls.ALGORITHM)

    @classmethod
    def get_token_pair(cls, email: str) -> dict[str, str]:
        return {
            "access_token": cls.create_token(email, cls.ACCESS_TOKEN_EXPIRE_MINUTES),
            "refresh_token": cls.create_token(
                email, cls.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60
            ),
        }

    @classmethod
    def decode_token(cls, token: str, token_type: str = "access") -> str:
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            return TokenPayload(**payload).sub
        except JWTError:
            raise ValueError("Invalid token")

    @classmethod
    def refresh_token(cls, refresh_token: str) -> dict[str, str]:
        email = cls.decode_token(refresh_token, "refresh")
        return cls.get_token_pair(email)


def get_password_hash() -> PasswordHash:
    return PasswordHash.recommended()
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/core/security.py
git commit -m "feat: add password hashing and JWT token service"
```

---

### Task 7: Auth endpoints

**Files:**
- Create: `backend/src/api/v1/routes/auth.py`

- [ ] **Step 1: Write auth routes**

```python
# backend/src/api/v1/routes/auth.py
from typing import Annotated

from fastapi import APIRouter, Depends, Form, status, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from src.core.database import get_db
from src.core.security import TokenService, get_password_hash
from src.models import User
from src.schemas import (
    UserResponseModel,
    RegistrationRequestModel,
    LoginRequestModel,
    TokensModel,
    RefreshRequest,
)

auth_router = APIRouter()
auth_scheme = HTTPBearer()


@auth_router.post(
    "/register/",
    description="Registration for new users.",
    response_model=UserResponseModel,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    user_data: Annotated[RegistrationRequestModel, Form()],
    password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email {user_data.email} already exists.",
        )

    hashed_password = password_hash.hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password,
        name=user_data.name,
        surname=user_data.surname,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return UserResponseModel.model_validate(new_user)


@auth_router.post(
    "/login/",
    description="Login with password and username",
    response_model=TokensModel,
    status_code=status.HTTP_200_OK,
)
async def login(
    user_data: Annotated[LoginRequestModel, Form()],
    password_hash: Annotated[PasswordHash, Depends(get_password_hash)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(User).where(User.email == user_data.email))
    user = result.scalar_one_or_none()

    success_login = True

    if user is None:
        fake_hash = password_hash.hash("dummypassword")
        password_hash.verify(user_data.password, fake_hash)
        success_login = False
    elif not password_hash.verify(user_data.password, user.password):
        success_login = False

    if not success_login:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_pair = TokenService.get_token_pair(user.email)
    token_pair["token_type"] = "bearer"
    return TokensModel(**token_pair)


@auth_router.get(
    "/me/",
    description="Get current user.",
    response_model=UserResponseModel,
    status_code=status.HTTP_200_OK,
)
async def get_user(
    authorization_data: Annotated[HTTPAuthorizationCredentials, Depends(auth_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    token = authorization_data.credentials
    email = TokenService.decode_token(token, "access")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserResponseModel.model_validate(user)


@auth_router.post(
    "/refresh/",
    description="Refresh token.",
    response_model=TokensModel,
    status_code=status.HTTP_200_OK,
)
async def refresh_token(data: RefreshRequest):
    token_pair = TokenService.refresh_token(data.refresh_token)
    token_pair["token_type"] = "bearer"
    return TokensModel(**token_pair)
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/api/v1/routes/auth.py
git commit -m "feat: add auth routes (register, login, me, refresh)"
```

---

### Task 8: Обновление main.py

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Update main.py with new structure**

```python
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
```

- [ ] **Step 2: Commit**

```bash
git add backend/main.py
git commit -m "refactor: update main.py with new structure"
```

---

### Task 9: Зависимости проекта

**Files:**
- Create: `backend/requirements.txt`

- [ ] **Step 1: Write requirements.txt**

```txt
# backend/requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
asyncpg==0.30.0
alembic==1.14.0
pydantic==2.10.4
pydantic-settings==2.7.1
python-jose[cryptography]==3.3.0
pwdlib[argon2]==0.2.1
python-dotenv==1.0.1
email-validator==2.2.0
pytest==8.3.4
pytest-asyncio==0.24.0
httpx==0.28.1
```

- [ ] **Step 2: Commit**

```bash
git add backend/requirements.txt
git commit -m "chore: add project dependencies"
```

---

### Task 10: Alembic конфигурация

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/migrations/env.py`
- Create: `backend/migrations/script.py.mako`

- [ ] **Step 1: Write alembic.ini**

```ini
# backend/alembic.ini
[alembic]
script_location = migrations
prepend_sys_path = .
version_path_separator = os
sqlalchemy.url = postgresql+asyncpg://postgres:postgres@localhost:5432/whale_identification

[post_write_hooks]

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 2: Write migrations/env.py**

```python
# backend/migrations/env.py
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

from src.models import Base
from src.config.settings import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", settings.db.database_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Write migrations/script.py.mako**

```mako
# backend/migrations/script.py.mako
"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
${imports if imports else ""}

# revision identifiers, used by Alembic.
revision: str = ${repr(up_revision)}
down_revision: Union[str, None] = ${repr(down_revision)}
branch_labels: Union[str, Sequence[str], None] = ${repr(branch_labels)}
depends_on: Union[str, Sequence[str], None] = ${repr(depends_on)}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
```

- [ ] **Step 4: Commit**

```bash
git add backend/alembic.ini backend/migrations/
git commit -m "feat: add Alembic migration configuration"
```

---

### Task 11: Первая миграция

**Files:**
- Create: `backend/migrations/versions/001_initial.py`

- [ ] **Step 1: Generate initial migration manually**

```bash
cd backend
alembic revision --autogenerate -m "Initial migration"
```

- [ ] **Step 2: Verify migration file created**

Run: `ls backend/migrations/versions/`
Expected: Output showing a new migration file

- [ ] **Step 3: Commit**

```bash
git add backend/migrations/versions/
git commit -m "feat: add initial migration for users table"
```

---

### Task 12: Тестовые fixtures

**Files:**
- Create: `backend/tests/conftest.py`

- [ ] **Step 1: Write pytest fixtures**

```python
# backend/tests/conftest.py
import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient

from src.models import Base
from src.main import app


TEST_DATABASE_URL = "postgresql+asyncpg://test_user:test_pass@localhost:5432/test_db"


test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=True,
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

- [ ] **Step 2: Create empty __init__ for tests**

```bash
touch backend/tests/__init__.py
touch backend/tests/integration/__init__.py
touch backend/tests/unit/__init__.py
```

- [ ] **Step 3: Commit**

```bash
git add backend/tests/conftest.py
git add backend/tests/__init__.py backend/tests/integration/__init__.py backend/tests/unit/__init__.py
git commit -m "test: add pytest fixtures for async testing"
```

---

### Task 13: Интеграционные тесты auth

**Files:**
- Create: `backend/tests/integration/test_auth.py`

- [ ] **Step 1: Write auth integration tests**

```python
# backend/tests/integration/test_auth.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from src.models import User


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db_session: AsyncSession):
    response = await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test"
    assert "id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "anotherpass123",
            "name": "Another",
            "surname": "User",
        },
    )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "wrongpassword",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    login_response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    token = login_response.json()["access_token"]

    response = await client.get(
        "/api/v1/me/",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession):
    await client.post(
        "/api/v1/register/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
            "name": "Test",
            "surname": "User",
        },
    )

    login_response = await client.post(
        "/api/v1/login/",
        data={
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    refresh_token = login_response.json()["refresh_token"]

    response = await client.post(
        "/api/v1/refresh/",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
```

- [ ] **Step 2: Commit**

```bash
git add backend/tests/integration/test_auth.py
git commit -m "test: add auth integration tests"
```

---

### Task 14: Unit тесты security

**Files:**
- Create: `backend/tests/unit/test_security.py`

- [ ] **Step 1: Write security unit tests**

```python
# backend/tests/unit/test_security.py
import pytest
from datetime import datetime, timedelta

from src.core.security import TokenService


def test_create_token():
    token = TokenService.create_token("test@example.com", 30)
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_valid_token():
    token = TokenService.create_token("test@example.com", 30)
    email = TokenService.decode_token(token)
    assert email == "test@example.com"


def test_decode_invalid_token():
    with pytest.raises(ValueError, match="Invalid token"):
        TokenService.decode_token("invalid.token.here")


def test_get_token_pair():
    tokens = TokenService.get_token_pair("test@example.com")
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["access_token"] != tokens["refresh_token"]


def test_refresh_token():
    tokens = TokenService.get_token_pair("test@example.com")
    refresh_token = tokens["refresh_token"]

    new_tokens = TokenService.refresh_token(refresh_token)
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens


def test_token_expiration():
    token = TokenService.create_token("test@example.com", 0)
    with pytest.raises(ValueError):
        TokenService.decode_token(token)
```

- [ ] **Step 2: Commit**

```bash
git add backend/tests/unit/test_security.py
git commit -m "test: add security unit tests"
```

---

### Task 15: Удаление старого кода

**Files:**
- Delete: `backend/auth/`
- Delete: `backend/db/`
- Delete: `backend/utils/`
- Delete: `backend/config/__init__.py`
- Delete: `backend/.venv/` (если существует)

- [ ] **Step 1: Remove old auth directory**

```bash
rm -rf backend/auth
```

- [ ] **Step 2: Remove old db directory**

```bash
rm -rf backend/db
```

- [ ] **Step 3: Remove old utils directory**

```bash
rm -rf backend/utils
```

- [ ] **Step 4: Remove old config init**

```bash
rm -f backend/config/__init__.py
```

- [ ] **Step 5: Remove old venv if exists**

```bash
rm -rf backend/.venv
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove old code structure"
```

---

### Task 16: Обновление .gitignore

**Files:**
- Modify: `backend/.gitignore`

- [ ] **Step 1: Update .gitignore for new structure**

```txt
# backend/.gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/
.venv/

# Environment variables
.env
.env.local

# Database
*.db
*.sqlite
*.sqlite3

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/

# Alembic
migrations/versions/*.pyc
```

- [ ] **Step 2: Commit**

```bash
git add backend/.gitignore
git commit -m "chore: update .gitignore for new structure"
```

---

### Task 17: Обновление README

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: Write new README**

```markdown
# Whale Identification API Backend

Backend для автоматической идентификации китов.

## Установка

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Настройте PostgreSQL:
```bash
createdb whale_identification
```

4. Создайте файл `.env` на основе `.env.example` и заполните настройки:
```bash
cp .env.example .env
```

5. Выполните миграции:
```bash
alembic upgrade head
```

## Запуск

```bash
uvicorn main:app --reload
```

API будет доступен по адресу: `http://localhost:8000`

Документация: `http://localhost:8000/docs`

## Тесты

1. Создайте тестовую базу данных:
```bash
createdb test_db
```

2. Обновите `.env` для тестов:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=test_user
DB_PASSWORD=test_pass
DB_NAME=test_db
```

3. Запустите тесты:
```bash
pytest
```

## Структура проекта

```
backend/
├── src/
│   ├── api/v1/routes/     # API endpoints
│   ├── schemas/          # Pydantic модели
│   ├── models/           # SQLAlchemy ORM
│   ├── core/             # База данных, security
│   └── config/           # Настройки
├── migrations/           # Alembic миграции
├── tests/                # Тесты
├── main.py              # FastAPI приложение
└── requirements.txt      # Зависимости
```

## API Endpoints

### Auth
- `POST /api/v1/register/` - Регистрация
- `POST /api/v1/login/` - Логин
- `GET /api/v1/me/` - Текущий пользователь (требует auth)
- `POST /api/v1/refresh/` - Обновление токена
```

- [ ] **Step 2: Commit**

```bash
git add backend/README.md
git commit -m "docs: update README with new structure and setup instructions"
```

---

### Task 18: Финальная проверка

**Files:**
- None

- [ ] **Step 1: Verify project structure**

```bash
cd backend
tree -L 3 -I 'venv|__pycache__|*.pyc'
```

Expected: Output showing the new directory structure

- [ ] **Step 2: Run tests**

```bash
cd backend
pytest -v
```

Expected: All tests pass

- [ ] **Step 3: Verify git status**

```bash
git status
```

Expected: Clean working directory

- [ ] **Step 4: Merge to main**

```bash
git checkout main
git merge feature/auth
```

- [ ] **Step 5: Final commit**

```bash
git push origin main
```
