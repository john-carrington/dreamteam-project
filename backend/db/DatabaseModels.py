from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Column, DateTime, ForeignKey
from datetime import datetime, timezone


class Base(DeclarativeBase):
    pass


class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    surname: Mapped[str]
    is_admin: Mapped[bool] = mapped_column(default=False)
    email: Mapped[str] = mapped_column(unique=True)
    password: Mapped[str]
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(tz=timezone.utc))
