import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from sqlmodel import select

from app.core.db import Base
from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserCreate, UserUpdate


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    full_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True, default=None
    )
    hashed_password: Mapped[str] = mapped_column(String(128), nullable=False)

    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=get_datetime_utc, nullable=True
    )

    # Dummy hash для защиты от timing-атак (когда пользователь не найден)
    DUMMY_HASH: str = (
        "$argon2id$v=19$m=65536,t=3,p=4$MjQyZWE1MzBjYjJlZTI0Yw$"
        "YTU4NGM5ZTZmYjE2NzZlZjY0ZWY3ZGRkY2U2OWFjNjk"
    )

    # ==================== CLASS METHODS ====================

    @classmethod
    async def create(cls, session: AsyncSession, user_create: UserCreate) -> "User":
        """
        Создать нового пользователя из схемы UserCreate.

        Args:
            session: Асинхронная сессия БД
            user_create: Схема с данными для создания

        Returns:
            Созданный экземпляр пользователя
        """
        user = cls(
            email=user_create.email,
            hashed_password=get_password_hash(user_create.password),
            is_active=user_create.is_active,
            is_superuser=user_create.is_superuser,
            full_name=user_create.full_name,
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @classmethod
    async def get_by_email(cls, session: AsyncSession, email: str) -> "User | None":
        """
        Получить пользователя по email.

        Args:
            session: Асинхронная сессия БД
            email: Адрес электронной почты

        Returns:
            Экземпляр пользователя или None
        """
        result = await session.execute(select(cls).where(cls.email == email))
        return result.scalars().first()

    @classmethod
    async def authenticate(
        cls, session: AsyncSession, email: str, password: str
    ) -> "User | None":
        """
        Аутентифицировать пользователя по email и паролю.

        Args:
            session: Асинхронная сессия БД
            email: Адрес электронной почты
            password: Пароль в открытом виде

        Returns:
            Экземпляр пользователя при успехе, None при ошибке
        """
        user = await cls.get_by_email(session=session, email=email)

        if not user:
            # Предотвращаем timing-атаки: всегда выполняем проверку хэша
            verify_password(password, cls.DUMMY_HASH)
            return None

        verified, updated_password_hash = verify_password(
            password, user.hashed_password
        )

        if not verified:
            return None

        # Если хэш пароля нуждается в обновлении (например, при смене алгоритма)
        if updated_password_hash:
            user.hashed_password = updated_password_hash
            session.add(user)
            await session.commit()
            await session.refresh(user)

        return user

    # ==================== INSTANCE METHODS ====================

    async def update(self, session: AsyncSession, user_in: UserUpdate) -> "User":
        """
        Обновить данные пользователя из схемы UserUpdate.

        Args:
            session: Асинхронная сессия БД
            user_in: Схема с данными для обновления

        Returns:
            Обновлённый экземпляр пользователя
        """
        user_data = user_in.model_dump(exclude_unset=True)

        # Специальная обработка пароля
        if "password" in user_data:
            user_data["hashed_password"] = get_password_hash(user_data.pop("password"))

        # Обновляем только переданные поля
        for key, value in user_data.items():
            if value is not None and hasattr(self, key):
                setattr(self, key, value)

        session.add(self)
        await session.commit()
        await session.refresh(self)
        return self

    async def delete(self, session: AsyncSession) -> None:
        """
        Удалить пользователя из базы данных.

        Args:
            session: Асинхронная сессия БД
        """
        await session.delete(self)
        await session.commit()

    # ==================== HELPER METHODS ====================

    def check_password(self, password: str) -> bool:
        """
        Проверить пароль без обновления хэша.

        Args:
            password: Пароль в открытом виде

        Returns:
            True если пароль верный, False иначе
        """
        verified, _ = verify_password(password, self.hashed_password)
        return verified
