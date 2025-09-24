from sqlalchemy import ForeignKey, String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, BaseModelMixin


class WorkSite(Base, BaseModelMixin):
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(50), nullable=False)
    zip_code: Mapped[str] = mapped_column(String(10), nullable=False)
    contact_person: Mapped[str] = mapped_column(String(150), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(15), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum("Active", "Inactive", name="status_enum"), nullable=False
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_worksite_organization"), nullable=False
    )
