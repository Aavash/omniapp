from typing import List
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey
from app.models.base import Base, BaseModelMixin


class OrganizationCategory(Base, BaseModelMixin):
    name: Mapped[str] = mapped_column(String(50))


class Organization(Base, BaseModelMixin):
    name: Mapped[str] = mapped_column(String(50))
    abbreviation: Mapped[str] = mapped_column(String(50))
    address: Mapped[str] = mapped_column(String(255))
    category: Mapped[int] = mapped_column(
        ForeignKey("OrganizationCategory.id", name="fk_organization_category")
    )

    # Use string literals for relationships
    # weekly_hours: Mapped[List["WeeklyHours"]] = relationship(
    #     "WeeklyHours", back_populates="organization"
    # )
