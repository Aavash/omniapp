from typing import Optional
from app.models.base import Base, BaseModelMixin
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Boolean, CheckConstraint, Float, String, ForeignKey


class Shift(Base, BaseModelMixin):
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", name="fk_shift_employee")
    )
    title: Mapped[str] = mapped_column(String(255))
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_shift_organization")
    )
    worksite_id: Mapped[int] = mapped_column(
        ForeignKey("WorkSite.id", name="fk_shift_worksite")
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    shift_start: Mapped[str] = mapped_column(String(5), nullable=False)
    shift_end: Mapped[str] = mapped_column(String(5), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    called_in: Mapped[bool] = mapped_column(Boolean, default=True)
    call_in_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class ShiftPresetGroup(Base, BaseModelMixin):
    title: Mapped[str] = mapped_column(String(255))
    worksite_id: Mapped[int] = mapped_column(
        ForeignKey("WorkSite.id", name="fk_shift_preset_worksite")
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_shift_preset_organization")
    )


class ShiftPreset(Base, BaseModelMixin):
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", name="fk_shift_preset_employee")
    )
    preset_group_id: Mapped[int] = mapped_column(
        ForeignKey("ShiftPresetGroup.id", name="fk_shift_preset_preset_group")
    )
    title: Mapped[str] = mapped_column(String(255))
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_shift_preset_organization")
    )

    day_of_week: Mapped[int] = mapped_column(nullable=False)
    shift_start: Mapped[str] = mapped_column(String(5), nullable=False)
    shift_end: Mapped[str] = mapped_column(String(5), nullable=False)
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        CheckConstraint("day_of_week BETWEEN 1 AND 7", name="check_day_range"),
        CheckConstraint("shift_end > shift_start", name="check_shift_end_after_start"),
    )


class EmployeePunch(Base, BaseModelMixin):
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", name="fk_punchin_employee"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_punchin_organization"), nullable=False
    )
    date: Mapped[str] = mapped_column(String(10), nullable=False)
    punch_in_time: Mapped[str] = mapped_column(String(5), nullable=False)
    punch_out_time: Mapped[str] = mapped_column(String(5), nullable=False)
    overtime_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    shift_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("Shift.id", name="fk_punchin_shift"), nullable=True
    )
    remarks: Mapped[Optional[str]] = mapped_column(String(255))


class Payslip(Base, BaseModelMixin):
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("User.id", name="fk_payslip_employee"), nullable=False
    )
    organization_id: Mapped[int] = mapped_column(
        ForeignKey("Organization.id", name="fk_payslip_organization"), nullable=False
    )
    period_start: Mapped[str] = mapped_column(String(10), nullable=False)
    period_end: Mapped[str] = mapped_column(String(10), nullable=False)
    total_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    overtime_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    base_salary: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    overtime_pay: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    deductions: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    net_pay: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    remarks: Mapped[Optional[str]] = mapped_column(String)
