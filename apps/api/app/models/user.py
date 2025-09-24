from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, LargeBinary, String, Boolean, Float, Enum
import enum
from app.models.base import Base, BaseModelMixin
from datetime import time


class PayType(enum.Enum):
    HOURLY = "HOURLY"
    MONTHLY = "MONTHLY"


class DayOfWeek(enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class User(Base, BaseModelMixin):
    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str] = mapped_column(String(50), unique=True)
    phone_number: Mapped[str] = mapped_column(String(10), unique=True)
    phone_number_ext: Mapped[str] = mapped_column(String(5))
    address: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    pay_type: Mapped[str] = mapped_column(Enum(PayType))
    payrate: Mapped[float] = mapped_column(Float)
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_user_organization")
    )
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Use string literals for relationships
    # weekly_hours: Mapped[List["weekly_hours"]] = relationship("weekly_hours", back_populates="employee")

    availability: Mapped["Availability"] = relationship(
        "Availability",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Availability(Base, BaseModelMixin):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", ondelete="CASCADE"), unique=True
    )

    # Monday
    monday_available: Mapped[bool] = mapped_column(default=False)
    monday_start: Mapped[time | None] = mapped_column(nullable=True)
    monday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Tuesday
    tuesday_available: Mapped[bool] = mapped_column(default=False)
    tuesday_start: Mapped[time | None] = mapped_column(nullable=True)
    tuesday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Wednesday
    wednesday_available: Mapped[bool] = mapped_column(default=False)
    wednesday_start: Mapped[time | None] = mapped_column(nullable=True)
    wednesday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Thursday
    thursday_available: Mapped[bool] = mapped_column(default=False)
    thursday_start: Mapped[time | None] = mapped_column(nullable=True)
    thursday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Friday
    friday_available: Mapped[bool] = mapped_column(default=False)
    friday_start: Mapped[time | None] = mapped_column(nullable=True)
    friday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Saturday
    saturday_available: Mapped[bool] = mapped_column(default=False)
    saturday_start: Mapped[time | None] = mapped_column(nullable=True)
    saturday_end: Mapped[time | None] = mapped_column(nullable=True)

    # Sunday
    sunday_available: Mapped[bool] = mapped_column(default=False)
    sunday_start: Mapped[time | None] = mapped_column(nullable=True)
    sunday_end: Mapped[time | None] = mapped_column(nullable=True)

    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user: Mapped["User"] = relationship("User", back_populates="availability")
