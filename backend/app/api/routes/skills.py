from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from app.core.db import Base


class Skill(Base):

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]


class SkillDegree(Base):

    __tablename__ = "skill_degrees"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str]


class UserSkill(Base):

    __tablename__ = "user_skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id", ondelete="CASCADE"))
    skill_degree_id: Mapped[int] = mapped_column(ForeignKey("skill_degrees.id", ondelete="SET NULL"), nullable=True)


class SkillConfirmation(Base):

    __tablename__ = "skill_confirmations"

    id: Mapped[int] = mapped_column(primary_key=True)
    grade: Mapped[int]
    user_skill_id: Mapped[int] = mapped_column(ForeignKey("user_skills.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
