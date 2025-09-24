from app.models.base import Base, BaseModelMixin
from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey


class SubscriptionPlan(Base, BaseModelMixin):
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    features: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class OrganizationSubscriptionSettings(Base, BaseModelMixin):
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id"), nullable=False
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("SubscriptionPlan.id"), nullable=False
    )
    activate_manually: Mapped[bool] = mapped_column(Boolean, default=False)
    start_date: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[DateTime] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class OrganizationSubscriptionPayment(Base, BaseModelMixin):
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id"), nullable=False
    )
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("SubscriptionPlan.id"), nullable=False
    )
    payment_amount: Mapped[float] = mapped_column(Float, nullable=False)
