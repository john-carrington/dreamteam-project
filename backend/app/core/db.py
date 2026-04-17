from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# ✅ Base должен быть определён ДО любых импортов моделей
class Base(AsyncAttrs, DeclarativeBase):
    """Базовый класс для декларативных моделей SQLAlchemy."""

    pass


engine = create_async_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db(session: AsyncSession) -> None:
    """
    Инициализация БД: создание суперпользователя.

    ✅ Импортируем модели ВНУТРИ функции, чтобы избежать циклического импорта.
    """
    # Локальный импорт — разрывает цикл
    from sqlmodel import select

    from app.models.users import User, UserCreate

    result = await session.execute(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    )
    user = result.scalars().first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = await User.create(session=session, user_create=user_in)
