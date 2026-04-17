"""add expertise domain tables

Revision ID: 8e1f3a4b7c2d
Revises: 20ac1e999d19
Create Date: 2026-04-18 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "8e1f3a4b7c2d"
down_revision = "20ac1e999d19"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "expertise_profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("department", sa.String(length=255), nullable=False),
        sa.Column("avatar", sa.String(length=500), nullable=False),
        sa.Column("experience_projects", sa.Text(), nullable=False),
        sa.Column("experience_speaking", sa.Text(), nullable=False),
        sa.Column("experience_mentoring", sa.Text(), nullable=False),
        sa.Column("readiness_speaker", sa.Boolean(), nullable=False),
        sa.Column("readiness_mentor", sa.Boolean(), nullable=False),
        sa.Column("readiness_jury", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "skills",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("level", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", "type", name="uq_skills_user_name_type"),
    )
    with op.batch_alter_table("skills", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_skills_user_id"), ["user_id"], unique=False)

    op.create_table(
        "skill_endorsements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("skill_id", sa.Uuid(), nullable=False),
        sa.Column("endorsed_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["endorsed_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["skill_id"], ["skills.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "skill_id",
            "endorsed_by_user_id",
            name="uq_skill_endorsements_skill_endorser",
        ),
    )
    with op.batch_alter_table("skill_endorsements", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_skill_endorsements_skill_id"), ["skill_id"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_skill_endorsements_endorsed_by_user_id"),
            ["endorsed_by_user_id"],
            unique=False,
        )

    op.create_table(
        "invitations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("created_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("candidate_user_id", sa.Uuid(), nullable=False),
        sa.Column("activity_type", sa.String(length=16), nullable=False),
        sa.Column("query_text", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("responded_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["candidate_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("invitations", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_invitations_created_by_user_id"),
            ["created_by_user_id"],
            unique=False,
        )
        batch_op.create_index(
            batch_op.f("ix_invitations_candidate_user_id"),
            ["candidate_user_id"],
            unique=False,
        )


def downgrade():
    with op.batch_alter_table("invitations", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_invitations_candidate_user_id"))
        batch_op.drop_index(batch_op.f("ix_invitations_created_by_user_id"))
    op.drop_table("invitations")

    with op.batch_alter_table("skill_endorsements", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_skill_endorsements_endorsed_by_user_id"))
        batch_op.drop_index(batch_op.f("ix_skill_endorsements_skill_id"))
    op.drop_table("skill_endorsements")

    with op.batch_alter_table("skills", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_skills_user_id"))
    op.drop_table("skills")

    op.drop_table("expertise_profiles")
