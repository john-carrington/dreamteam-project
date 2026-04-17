from sqlalchemy.ext.asyncio import (
    AsyncAttrs,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlmodel import select

from app import crud
from app.core.config import settings
from app.models.user import User, UserCreate


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
        user = await crud.create_user(session=session, user_create=user_in)
