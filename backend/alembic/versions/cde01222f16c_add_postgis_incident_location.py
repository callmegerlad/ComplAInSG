"""add postgis + incident location

Revision ID: cde01222f16c
Revises: fb08d15f7728
Create Date: 2026-03-03 03:56:50.603504

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geography

# revision identifiers, used by Alembic.
revision: str = 'cde01222f16c'
down_revision: Union[str, Sequence[str], None] = 'fb08d15f7728'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1) Enable PostGIS
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # 2) Add location column
    op.add_column(
        "incident_reports",
        sa.Column("location", Geography(geometry_type="POINT", srid=4326), nullable=True),
    )

    # 3) Backfill from existing lat/lng
    op.execute("""
        UPDATE incident_reports
        SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        WHERE location IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
    """)

    # 4) Add GiST index (important for ST_DWithin performance)
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_incident_reports_location
        ON incident_reports
        USING GIST (location);
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("DROP INDEX IF EXISTS idx_incident_reports_location;")
    op.drop_column("incident_reports", "location")
   
