"""Seed organization category

Revision ID: 6ff3c171aec4
Revises: cdd2352f82e8
Create Date: 2025-02-04 22:52:22.858530

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "6ff3c171aec4"
down_revision: Union[str, None] = "b718e2e6c65a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Organization categories seed data
organization_categories = [
    {"id": 1, "name": "Technology", "is_deleted": False},
    {"id": 2, "name": "Healthcare", "is_deleted": False},
    {"id": 3, "name": "Finance", "is_deleted": False},
    {"id": 4, "name": "Education", "is_deleted": False},
    {"id": 5, "name": "Retail", "is_deleted": False},
    {"id": 6, "name": "Food & Beverage", "is_deleted": False},
    {"id": 7, "name": "E-commerce", "is_deleted": False},
    {"id": 8, "name": "Beauty & Wellness", "is_deleted": False},
    {"id": 9, "name": "Fitness & Gym", "is_deleted": False},
    {"id": 10, "name": "Freelance & Consulting", "is_deleted": False},
    {"id": 11, "name": "Home Services", "is_deleted": False},
    {"id": 12, "name": "Event Planning", "is_deleted": False},
    {"id": 13, "name": "Handmade & Crafts", "is_deleted": False},
    {"id": 14, "name": "Marketing & Advertising", "is_deleted": False},
    {"id": 15, "name": "Cleaning Services", "is_deleted": False},
    {"id": 16, "name": "Pet Services", "is_deleted": False},
    {"id": 17, "name": "Photography & Videography", "is_deleted": False},
    {"id": 18, "name": "Automotive Services", "is_deleted": False},
    {"id": 19, "name": "Real Estate", "is_deleted": False},
    {"id": 20, "name": "Legal & Accounting", "is_deleted": False},
]


def upgrade() -> None:
    # Insert categories
    op.bulk_insert(
        sa.table(
            "OrganizationCategory",
            sa.column("id", sa.Integer),
            sa.column("name", sa.String),
            sa.column("is_deleted", sa.Boolean),
        ),
        organization_categories,
    )


def downgrade() -> None:
    category_ids = [category["id"] for category in organization_categories]
    op.execute(
        f"DELETE FROM OrganizationCategory WHERE id IN ({', '.join(map(str, category_ids))})"
    )
