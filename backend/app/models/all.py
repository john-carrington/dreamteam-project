from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


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


class UserExperience(Base):

    __tablename__ = "user_experiences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    performence_experience_id = mapped_column(ForeignKey("performence_experiences.id", ondelete="CASCADE"))


class UserPerformenceReadinessStatus(Base):

    __tablename__ = "user_performance_readiness_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    performance_readiness_status_id = mapped_column(ForeignKey("performance_readiness_statuses.id", ondelete="CASCADE"))





class PerformenceExperience(Base):

    __tablename__ = "performence_experiences"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]


class PerformanceReadinessStatus(Base):

    __tablename__ = "performance_readiness_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]


class Event(Base):

    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InvitatonStatus(Base):

    __tablename__ = "invitation_statuses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]


class Invitation(Base):

    __tablename__ = "invitations"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    sandler_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    invitation_status_id: Mapped[int] = mapped_column(ForeignKey("invitation_statuses.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(tz=timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EventsHistory(Base):

    __tablename__ = "events_histories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
