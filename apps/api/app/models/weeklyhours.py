from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import ForeignKey, Float, Date
from app.models.base import Base, BaseModelMixin


class WeeklyHours(Base, BaseModelMixin):
    __tablename__ = "weekly_hours"

    employee_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", name="fk_weekly_hours_employee"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_weekly_hours_organization"),
        nullable=False,
    )
    week_start: Mapped[Date] = mapped_column(Date, nullable=False)
    week_end: Mapped[Date] = mapped_column(Date, nullable=False)
    scheduled_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    worked_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    overtime_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_deleted: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Use string literals for relationships
    # employee: Mapped["User"] = relationship("User", back_populates="weekly_hours")
    # organization: Mapped["Organization"] = relationship(
    #     "Organization", back_populates="weekly_hours"
    # )

    def __repr__(self):
        return (
            f"<WeeklyHours(id={self.id}, employee_id={self.employee_id}, "
            f"organization_id={self.organization_id}, week_start={self.week_start}, "
            f"week_end={self.week_end}, scheduled_hours={self.scheduled_hours}, "
            f"worked_hours={self.worked_hours}, overtime_hours={self.overtime_hours}, "
            f"is_deleted={self.is_deleted})>"
        )
