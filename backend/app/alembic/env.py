from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.engine import Connection

# ✅ 1. Сначала настройки
from app.core.config import settings

# ✅ 2. Затем Base — он уже определён и не зависит от моделей
from app.core.db import Base

# ✅ 3. Потом импортируем ВСЕ модели, чтобы они зарегистрировались в Base.metadata
# Это обязательно для работы --autogenerate
from app.models.expertise import ExpertiseProfile, Invitation, Skill, SkillEndorsement  # noqa: F401
from app.models.users import User  # noqa: F401

# from app.models.other import OtherModel  # добавляйте новые модели сюда

# ✅ 4. Убедитесь, что импорт настроек в секции alembic не конфликтует
# Если в проекте есть файл config.py в корне alembic/, переименуйте его или удалите

config = context.config

# ✅ Используем SYNC-драйвер для миграций
config.set_main_option("sqlalchemy.url", str(settings.SQLALCHEMY_DATABASE_URI_SYNC))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

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
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
