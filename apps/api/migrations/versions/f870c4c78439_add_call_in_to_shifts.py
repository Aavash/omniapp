"""add call in to shifts

Revision ID: f870c4c78439
Revises: 546c3228c50d
Create Date: 2025-04-19 13:33:51.285168

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "f870c4c78439"
down_revision: Union[str, None] = "546c3228c50d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "Shift",
        sa.Column("called_in", sa.Boolean(), server_default="false", nullable=False),
    )
    op.add_column(
        "Shift", sa.Column("call_in_reason", sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    op.drop_column("Shift", "call_in_reason")
    op.drop_column("Shift", "called_in")
