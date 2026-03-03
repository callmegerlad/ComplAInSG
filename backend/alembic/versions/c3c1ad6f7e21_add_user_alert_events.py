"""add_user_alert_events

Revision ID: c3c1ad6f7e21
Revises: fb08d15f7728
Create Date: 2026-03-03 14:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c3c1ad6f7e21"
down_revision: Union[str, Sequence[str], None] = "fb08d15f7728"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "user_alert_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("incident_id", sa.String(length=36), nullable=False),
        sa.Column(
            "event_type",
            sa.Enum(
                "RECEIVED",
                "OPEN",
                "VIEW_INCIDENT",
                "ACKNOWLEDGED",
                "RESPONDING",
                name="alerteventtype",
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["incident_id"], ["incident_reports.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "incident_id", "event_type", name="uq_user_alert_event"),
    )
    op.create_index(op.f("ix_user_alert_events_user_id"), "user_alert_events", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_alert_events_incident_id"), "user_alert_events", ["incident_id"], unique=False)
    op.create_index(op.f("ix_user_alert_events_event_type"), "user_alert_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_user_alert_events_created_at"), "user_alert_events", ["created_at"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_user_alert_events_created_at"), table_name="user_alert_events")
    op.drop_index(op.f("ix_user_alert_events_event_type"), table_name="user_alert_events")
    op.drop_index(op.f("ix_user_alert_events_incident_id"), table_name="user_alert_events")
    op.drop_index(op.f("ix_user_alert_events_user_id"), table_name="user_alert_events")
    op.drop_table("user_alert_events")
    op.execute("DROP TYPE IF EXISTS alerteventtype")
