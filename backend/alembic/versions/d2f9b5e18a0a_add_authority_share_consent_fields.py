"""add_authority_share_consent_fields

Revision ID: d2f9b5e18a0a
Revises: c3c1ad6f7e21
Create Date: 2026-03-04 23:40:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "d2f9b5e18a0a"
down_revision: Union[str, Sequence[str], None] = "c3c1ad6f7e21"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "incident_reports",
        sa.Column("authority_share_consent", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column(
        "incident_reports",
        sa.Column("authority_share_consented_at", sa.DateTime(), nullable=True),
    )
    op.alter_column("incident_reports", "authority_share_consent", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("incident_reports", "authority_share_consented_at")
    op.drop_column("incident_reports", "authority_share_consent")
