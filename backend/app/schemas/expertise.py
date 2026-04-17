from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

SkillType = Literal["профессиональный", "экспертный"]
SkillLevel = Literal["базовый", "уверенный", "эксперт"]
ActivityType = Literal["speaker", "mentor", "jury"]
InvitationStatus = Literal["pending", "accepted", "rejected"]


class ReadinessModel(BaseModel):
    speaker: bool = False
    mentor: bool = False
    jury: bool = False


class ExperienceModel(BaseModel):
    projects: str = ""
    speaking: str = ""
    mentoring: str = ""


class SkillPublic(BaseModel):
    id: UUID
    name: str
    type: SkillType
    level: SkillLevel
    endorsements: list[str] = []


class ExpertUserPublic(BaseModel):
    id: str
    name: str
    avatar: str
    title: str
    department: str
    skills: list[SkillPublic]
    experience: ExperienceModel
    readiness: ReadinessModel
    badges: list[str]


class ProfileUpdateRequest(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    avatar: str | None = Field(default=None, max_length=500)
    title: str | None = Field(default=None, max_length=255)
    department: str | None = Field(default=None, max_length=255)
    experience: ExperienceModel | None = None
    readiness: ReadinessModel | None = None


class SkillCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    type: SkillType
    level: SkillLevel


class SkillUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    type: SkillType | None = None
    level: SkillLevel | None = None


class EndorsementsPublic(BaseModel):
    skill_id: UUID
    count: int
    endorsers: list[str]


class SearchQueryParams(BaseModel):
    query: str = ""
    skill: str | None = None
    level: SkillLevel | None = None
    activity_type: ActivityType | None = None
    ready_only: bool = True
    sort_by: Literal["endorsements", "relevance"] = "relevance"


class InvitationCreateRequest(BaseModel):
    candidate_user_id: UUID
    activity_type: ActivityType
    query_text: str = Field(default="", max_length=255)
    message: str = Field(default="", max_length=1000)


class InvitationStatusUpdateRequest(BaseModel):
    status: Literal["accepted", "rejected"]


class InvitationPublic(BaseModel):
    id: UUID
    created_by_user_id: str
    created_by_name: str
    candidate_user_id: str
    candidate_name: str
    activity_type: ActivityType
    query_text: str
    message: str
    status: InvitationStatus
    created_at: datetime
    responded_at: datetime | None = None


class TopSkillPublic(BaseModel):
    name: str
    count: int


class AnalyticsPublic(BaseModel):
    ready_to_speak: int
    ready_to_mentor: int
    ready_to_jury: int
    top_skills: list[TopSkillPublic]


class LeaderboardEntryPublic(BaseModel):
    user_id: str
    name: str
    avatar: str
    department: str
    score: int
    badges: list[str]
