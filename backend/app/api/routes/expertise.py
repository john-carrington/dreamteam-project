import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException
from sqlalchemy import and_, func, or_
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep
from app.models.expertise import ExpertiseProfile, Invitation, Skill, SkillEndorsement
from app.models.security import Message
from app.models.users import User
from app.schemas.expertise import (
    AnalyticsPublic,
    EndorsementsPublic,
    ExperienceModel,
    ExpertUserPublic,
    InvitationCreateRequest,
    InvitationPublic,
    InvitationStatusUpdateRequest,
    LeaderboardEntryPublic,
    ProfileUpdateRequest,
    ReadinessModel,
    SkillCreateRequest,
    SkillPublic,
    SkillUpdateRequest,
    TopSkillPublic,
)

router = APIRouter(prefix="/expertise", tags=["expertise"])


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def user_display_name(user: User) -> str:
    if user.full_name and user.full_name.strip():
        return user.full_name.strip()
    return user.email.split("@")[0]


def build_badges(readiness: ReadinessModel, endorsements_total: int) -> list[str]:
    badges: list[str] = []
    if readiness.speaker:
        badges.append("Спикер")
    if readiness.mentor:
        badges.append("Ментор")
    if readiness.jury:
        badges.append("Жюри")
    if endorsements_total >= 5:
        badges.append("Эксперт")
    return badges


async def ensure_profile(session: SessionDep, user: User) -> ExpertiseProfile:
    profile = await session.get(ExpertiseProfile, user.id)
    if profile:
        return profile

    profile = ExpertiseProfile(
        user_id=user.id,
        avatar=f"https://i.pravatar.cc/150?u={user.id}",
        title="",
        department="",
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def get_endorsement_map(
    session: SessionDep, skill_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[str]]:
    if not skill_ids:
        return {}

    endorsement_result = await session.execute(
        select(SkillEndorsement).where(SkillEndorsement.skill_id.in_(skill_ids))
    )
    endorsements = endorsement_result.scalars().all()

    endorsement_map: dict[uuid.UUID, list[str]] = {skill_id: [] for skill_id in skill_ids}
    for endorsement in endorsements:
        endorsement_map.setdefault(endorsement.skill_id, []).append(
            str(endorsement.endorsed_by_user_id)
        )

    return endorsement_map


def serialize_user(
    user: User,
    profile: ExpertiseProfile | None,
    user_skills: list[Skill],
    endorsement_map: dict[uuid.UUID, list[str]],
) -> ExpertUserPublic:
    readiness = ReadinessModel(
        speaker=bool(profile.readiness_speaker) if profile else False,
        mentor=bool(profile.readiness_mentor) if profile else False,
        jury=bool(profile.readiness_jury) if profile else False,
    )

    skills: list[SkillPublic] = []
    total_endorsements = 0

    for skill in user_skills:
        endorsers = endorsement_map.get(skill.id, [])
        total_endorsements += len(endorsers)
        skills.append(
            SkillPublic(
                id=skill.id,
                name=skill.name,
                type=skill.type,
                level=skill.level,
                endorsements=endorsers,
            )
        )

    return ExpertUserPublic(
        id=str(user.id),
        name=user_display_name(user),
        avatar=profile.avatar if profile and profile.avatar else "",
        title=profile.title if profile else "",
        department=profile.department if profile else "",
        skills=skills,
        experience=ExperienceModel(
            projects=profile.experience_projects if profile else "",
            speaking=profile.experience_speaking if profile else "",
            mentoring=profile.experience_mentoring if profile else "",
        ),
        readiness=readiness,
        badges=build_badges(readiness, total_endorsements),
    )


async def load_expert_users(session: SessionDep) -> list[ExpertUserPublic]:
    user_result = await session.execute(select(User).where(User.is_active.is_(True)))
    users = user_result.scalars().all()

    if not users:
        return []

    user_ids = [user.id for user in users]

    profile_result = await session.execute(
        select(ExpertiseProfile).where(ExpertiseProfile.user_id.in_(user_ids))
    )
    profiles = profile_result.scalars().all()
    profile_by_user_id = {profile.user_id: profile for profile in profiles}

    skill_result = await session.execute(select(Skill).where(Skill.user_id.in_(user_ids)))
    all_skills = skill_result.scalars().all()
    skills_by_user_id: dict[uuid.UUID, list[Skill]] = {user.id: [] for user in users}
    for skill in all_skills:
        skills_by_user_id.setdefault(skill.user_id, []).append(skill)

    endorsement_map = await get_endorsement_map(session=session, skill_ids=[s.id for s in all_skills])

    serialized = [
        serialize_user(
            user=user,
            profile=profile_by_user_id.get(user.id),
            user_skills=skills_by_user_id.get(user.id, []),
            endorsement_map=endorsement_map,
        )
        for user in users
    ]

    return serialized


async def build_invitation_public(
    session: SessionDep,
    invitation: Invitation,
) -> InvitationPublic:
    users_result = await session.execute(
        select(User).where(
            User.id.in_([invitation.created_by_user_id, invitation.candidate_user_id])
        )
    )
    users = users_result.scalars().all()
    user_map = {str(user.id): user for user in users}

    created_by_id = str(invitation.created_by_user_id)
    candidate_id = str(invitation.candidate_user_id)

    created_by_user = user_map.get(created_by_id)
    candidate_user = user_map.get(candidate_id)

    return InvitationPublic(
        id=invitation.id,
        created_by_user_id=created_by_id,
        created_by_name=user_display_name(created_by_user) if created_by_user else "",
        candidate_user_id=candidate_id,
        candidate_name=user_display_name(candidate_user) if candidate_user else "",
        activity_type=invitation.activity_type,
        query_text=invitation.query_text,
        message=invitation.message,
        status=invitation.status,
        created_at=invitation.created_at,
        responded_at=invitation.responded_at,
    )


@router.get("/users", response_model=list[ExpertUserPublic])
async def get_expert_users(session: SessionDep, current_user: CurrentUser) -> list[ExpertUserPublic]:
    await ensure_profile(session=session, user=current_user)
    return await load_expert_users(session=session)


@router.get("/me", response_model=ExpertUserPublic)
async def get_my_expertise_profile(
    session: SessionDep, current_user: CurrentUser
) -> ExpertUserPublic:
    profile = await ensure_profile(session=session, user=current_user)
    skill_result = await session.execute(
        select(Skill).where(Skill.user_id == current_user.id).order_by(Skill.created_at.desc())
    )
    skills = skill_result.scalars().all()
    endorsement_map = await get_endorsement_map(session=session, skill_ids=[skill.id for skill in skills])
    return serialize_user(
        user=current_user,
        profile=profile,
        user_skills=skills,
        endorsement_map=endorsement_map,
    )


@router.patch("/me", response_model=ExpertUserPublic)
async def update_my_expertise_profile(
    session: SessionDep,
    current_user: CurrentUser,
    payload: ProfileUpdateRequest,
) -> ExpertUserPublic:
    profile = await ensure_profile(session=session, user=current_user)

    if payload.name is not None:
        current_user.full_name = payload.name.strip() or None
        session.add(current_user)

    if payload.avatar is not None:
        profile.avatar = payload.avatar.strip()
    if payload.title is not None:
        profile.title = payload.title.strip()
    if payload.department is not None:
        profile.department = payload.department.strip()

    if payload.experience is not None:
        profile.experience_projects = payload.experience.projects.strip()
        profile.experience_speaking = payload.experience.speaking.strip()
        profile.experience_mentoring = payload.experience.mentoring.strip()

    if payload.readiness is not None:
        profile.readiness_speaker = payload.readiness.speaker
        profile.readiness_mentor = payload.readiness.mentor
        profile.readiness_jury = payload.readiness.jury

    profile.updated_at = now_utc()
    session.add(profile)

    await session.commit()
    await session.refresh(profile)

    skill_result = await session.execute(
        select(Skill).where(Skill.user_id == current_user.id).order_by(Skill.created_at.desc())
    )
    skills = skill_result.scalars().all()
    endorsement_map = await get_endorsement_map(session=session, skill_ids=[skill.id for skill in skills])

    return serialize_user(
        user=current_user,
        profile=profile,
        user_skills=skills,
        endorsement_map=endorsement_map,
    )


@router.post("/me/skills", response_model=ExpertUserPublic)
async def create_my_skill(
    session: SessionDep,
    current_user: CurrentUser,
    payload: SkillCreateRequest,
) -> ExpertUserPublic:
    await ensure_profile(session=session, user=current_user)

    existing_skill_result = await session.execute(
        select(Skill).where(
            and_(
                Skill.user_id == current_user.id,
                func.lower(Skill.name) == payload.name.strip().lower(),
                Skill.type == payload.type,
            )
        )
    )
    if existing_skill_result.scalars().first():
        raise HTTPException(status_code=409, detail="Этот навык уже добавлен")

    skill = Skill(
        user_id=current_user.id,
        name=payload.name.strip(),
        type=payload.type,
        level=payload.level,
    )
    session.add(skill)
    await session.commit()

    return await get_my_expertise_profile(session=session, current_user=current_user)


@router.patch("/me/skills/{skill_id}", response_model=ExpertUserPublic)
async def update_my_skill(
    skill_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    payload: SkillUpdateRequest,
) -> ExpertUserPublic:
    skill_result = await session.execute(
        select(Skill).where(and_(Skill.id == skill_id, Skill.user_id == current_user.id))
    )
    skill = skill_result.scalars().first()
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    if payload.name is not None:
        skill.name = payload.name.strip()
    if payload.type is not None:
        skill.type = payload.type
    if payload.level is not None:
        skill.level = payload.level

    session.add(skill)
    await session.commit()
    return await get_my_expertise_profile(session=session, current_user=current_user)


@router.delete("/me/skills/{skill_id}", response_model=Message)
async def delete_my_skill(
    skill_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    skill_result = await session.execute(
        select(Skill).where(and_(Skill.id == skill_id, Skill.user_id == current_user.id))
    )
    skill = skill_result.scalars().first()
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    await session.delete(skill)
    await session.commit()
    return Message(message="Навык удален")


@router.post("/skills/{skill_id}/endorse", response_model=EndorsementsPublic)
async def endorse_skill(
    skill_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> EndorsementsPublic:
    skill = await session.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    if skill.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя подтверждать свой навык")

    endorsement_result = await session.execute(
        select(SkillEndorsement).where(
            and_(
                SkillEndorsement.skill_id == skill_id,
                SkillEndorsement.endorsed_by_user_id == current_user.id,
            )
        )
    )
    endorsement = endorsement_result.scalars().first()

    if not endorsement:
        endorsement = SkillEndorsement(
            skill_id=skill_id,
            endorsed_by_user_id=current_user.id,
        )
        session.add(endorsement)
        await session.commit()

    return await get_skill_endorsements(skill_id=skill_id, session=session, current_user=current_user)


@router.delete("/skills/{skill_id}/endorse", response_model=Message)
async def remove_endorsement(
    skill_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    endorsement_result = await session.execute(
        select(SkillEndorsement).where(
            and_(
                SkillEndorsement.skill_id == skill_id,
                SkillEndorsement.endorsed_by_user_id == current_user.id,
            )
        )
    )
    endorsement = endorsement_result.scalars().first()
    if not endorsement:
        raise HTTPException(status_code=404, detail="Подтверждение не найдено")

    await session.delete(endorsement)
    await session.commit()
    return Message(message="Подтверждение удалено")


@router.get("/skills/{skill_id}/endorsements", response_model=EndorsementsPublic)
async def get_skill_endorsements(
    skill_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
) -> EndorsementsPublic:
    _ = current_user

    skill = await session.get(Skill, skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Навык не найден")

    endorsement_result = await session.execute(
        select(SkillEndorsement).where(SkillEndorsement.skill_id == skill_id)
    )
    endorsements = endorsement_result.scalars().all()

    return EndorsementsPublic(
        skill_id=skill_id,
        count=len(endorsements),
        endorsers=[str(item.endorsed_by_user_id) for item in endorsements],
    )


@router.get("/search", response_model=list[ExpertUserPublic])
async def search_experts(
    session: SessionDep,
    current_user: CurrentUser,
    query: str = "",
    skill: str | None = None,
    level: Literal["базовый", "уверенный", "эксперт"] | None = None,
    activity_type: Literal["speaker", "mentor", "jury"] | None = None,
    ready_only: bool = True,
    sort_by: Literal["endorsements", "relevance"] = "relevance",
) -> list[ExpertUserPublic]:
    _ = current_user
    users = await load_expert_users(session=session)

    query_lc = query.strip().lower()
    skill_lc = skill.strip().lower() if skill else None

    scored: list[tuple[int, int, ExpertUserPublic]] = []

    for user in users:
        endorsements_total = sum(len(skill_item.endorsements) for skill_item in user.skills)
        score = endorsements_total

        if level and not any(skill_item.level == level for skill_item in user.skills):
            continue

        if skill_lc and not any(skill_lc in skill_item.name.lower() for skill_item in user.skills):
            continue

        if activity_type:
            is_ready = {
                "speaker": user.readiness.speaker,
                "mentor": user.readiness.mentor,
                "jury": user.readiness.jury,
            }[activity_type]
            if ready_only and not is_ready:
                continue
            if is_ready:
                score += 6

        if query_lc:
            searchable_parts = [
                user.name,
                user.title,
                user.department,
                user.experience.projects,
                user.experience.speaking,
                user.experience.mentoring,
                " ".join(skill_item.name for skill_item in user.skills),
            ]
            searchable_text = " ".join(searchable_parts).lower()
            tokens = [token for token in query_lc.split() if token]
            token_hits = sum(1 for token in tokens if token in searchable_text)
            if token_hits == 0:
                continue

            score += token_hits * 5
            if query_lc in user.name.lower():
                score += 8
            if any(query_lc in skill_item.name.lower() for skill_item in user.skills):
                score += 10

        scored.append((score, endorsements_total, user))

    if sort_by == "endorsements":
        scored.sort(key=lambda item: (item[1], item[0], item[2].name.lower()), reverse=True)
    else:
        scored.sort(key=lambda item: (item[0], item[1], item[2].name.lower()), reverse=True)

    return [item[2] for item in scored]


@router.post("/invitations", response_model=InvitationPublic)
async def create_invitation(
    session: SessionDep,
    current_user: CurrentUser,
    payload: InvitationCreateRequest,
) -> InvitationPublic:
    if payload.candidate_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя отправить приглашение самому себе")

    candidate_user = await session.get(User, payload.candidate_user_id)
    if not candidate_user or not candidate_user.is_active:
        raise HTTPException(status_code=404, detail="Кандидат не найден")

    invitation = Invitation(
        created_by_user_id=current_user.id,
        candidate_user_id=payload.candidate_user_id,
        activity_type=payload.activity_type,
        query_text=payload.query_text.strip(),
        message=payload.message.strip(),
        status="pending",
    )
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)

    return await build_invitation_public(session=session, invitation=invitation)


@router.get("/invitations", response_model=list[InvitationPublic])
async def get_invitations(
    session: SessionDep,
    current_user: CurrentUser,
    scope: Literal["created", "received", "all"] = "all",
) -> list[InvitationPublic]:
    if scope == "created":
        filter_expr = Invitation.created_by_user_id == current_user.id
    elif scope == "received":
        filter_expr = Invitation.candidate_user_id == current_user.id
    else:
        filter_expr = or_(
            Invitation.created_by_user_id == current_user.id,
            Invitation.candidate_user_id == current_user.id,
        )

    invitation_result = await session.execute(
        select(Invitation).where(filter_expr).order_by(Invitation.created_at.desc())
    )
    invitations = invitation_result.scalars().all()

    return [
        await build_invitation_public(session=session, invitation=invitation)
        for invitation in invitations
    ]


@router.patch("/invitations/{invitation_id}/status", response_model=InvitationPublic)
async def update_invitation_status(
    invitation_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
    payload: InvitationStatusUpdateRequest,
) -> InvitationPublic:
    invitation = await session.get(Invitation, invitation_id)
    if not invitation:
        raise HTTPException(status_code=404, detail="Приглашение не найдено")

    if invitation.candidate_user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Недостаточно прав")

    if invitation.status != "pending" and payload.status != invitation.status:
        raise HTTPException(
            status_code=400,
            detail="Статус уже установлен и не может быть изменен",
        )

    invitation.status = payload.status
    invitation.responded_at = now_utc()
    session.add(invitation)
    await session.commit()
    await session.refresh(invitation)

    return await build_invitation_public(session=session, invitation=invitation)


@router.get("/leaderboard", response_model=list[LeaderboardEntryPublic])
async def get_leaderboard(
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = 10,
) -> list[LeaderboardEntryPublic]:
    _ = current_user
    users = await load_expert_users(session=session)

    scored_users: list[tuple[int, ExpertUserPublic]] = []
    for user in users:
        score = sum(len(skill.endorsements) for skill in user.skills)
        scored_users.append((score, user))

    scored_users.sort(key=lambda item: (item[0], item[1].name.lower()), reverse=True)

    return [
        LeaderboardEntryPublic(
            user_id=user.id,
            name=user.name,
            avatar=user.avatar,
            department=user.department,
            score=score,
            badges=user.badges,
        )
        for score, user in scored_users[: max(1, min(limit, 100))]
    ]


@router.get("/analytics", response_model=AnalyticsPublic)
async def get_expertise_analytics(
    session: SessionDep,
    current_user: CurrentUser,
) -> AnalyticsPublic:
    _ = current_user
    users = await load_expert_users(session=session)

    ready_to_speak = sum(1 for user in users if user.readiness.speaker)
    ready_to_mentor = sum(1 for user in users if user.readiness.mentor)
    ready_to_jury = sum(1 for user in users if user.readiness.jury)

    skill_counts: dict[str, int] = {}
    for user in users:
        for skill in user.skills:
            key = skill.name.strip()
            if key:
                skill_counts[key] = skill_counts.get(key, 0) + 1

    top_skills = [
        TopSkillPublic(name=name, count=count)
        for name, count in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:8]
    ]

    return AnalyticsPublic(
        ready_to_speak=ready_to_speak,
        ready_to_mentor=ready_to_mentor,
        ready_to_jury=ready_to_jury,
        top_skills=top_skills,
    )
