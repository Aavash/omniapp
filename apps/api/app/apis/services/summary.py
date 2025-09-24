from typing import Optional, List, Dict
from fastapi import status
from sqlalchemy import and_, func, extract
from fastapi import HTTPException
from pytest import Session
from datetime import datetime, timedelta

from app.apis.dtos.summary import (
    EmployeePerformance,
    MonthlyWorksiteSummaryResponse,
    WeeklyHours,
)
from app.models.shift import EmployeePunch, Payslip, Shift
from app.models.user import User


def calculate_monthly_worksite_summary(
    db: Session,
    organization_id: int,
    worksite_id: Optional[int] = None,
    month: Optional[str] = None,
) -> MonthlyWorksiteSummaryResponse:
    if month:
        try:
            datetime.strptime(month, "%Y-%m")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month format. Use YYYY-MM.",
            )

    employee_query = db.query(User).filter(User.organization_id == organization_id)
    # Note: Users don't have worksite_id, they work at different worksites through shifts
    total_employees = employee_query.count()
    total_inactive_employees = employee_query.filter_by(is_active=False).count()

    shift_query = db.query(Shift).filter(Shift.organization_id == organization_id)
    if worksite_id:
        shift_query = shift_query.filter(Shift.worksite_id == worksite_id)
    if month:
        # Use SQLite compatible date filtering
        shift_query = shift_query.filter(func.substr(Shift.date, 1, 7) == month)

    total_hours = 0
    for shift in shift_query.all():
        try:
            start_time = datetime.strptime(shift.shift_start, "%H:%M").time()
            end_time = datetime.strptime(shift.shift_end, "%H:%M").time()

            start_datetime = datetime.combine(datetime.today(), start_time)
            end_datetime = datetime.combine(datetime.today(), end_time)

            if end_datetime < start_datetime:
                end_datetime += timedelta(days=1)

            time_difference = end_datetime - start_datetime
            total_hours += time_difference.total_seconds() / 3600
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid time format in shift records: {e}",
            )

    # Calculate weekly hours
    weekly_hours = []
    if month:
        year, month_num = map(int, month.split("-"))
        first_day = datetime(year, month_num, 1)
    else:
        # Default to current month if no month specified
        now = datetime.now()
        year, month_num = now.year, now.month
        first_day = datetime(year, month_num, 1)
    last_day = (
        (datetime(year, month_num + 1, 1) - timedelta(days=1))
        if month_num < 12
        else datetime(year + 1, 1, 1) - timedelta(days=1)
    )

    current_week_start = first_day
    week_num = 1

    while current_week_start <= last_day:
        week_end = current_week_start + timedelta(days=6)
        if week_end > last_day:
            week_end = last_day

        week_shifts = shift_query.filter(
            and_(
                Shift.date >= current_week_start.date().isoformat(),
                Shift.date <= week_end.date().isoformat(),
            )
        ).all()

        week_total = 0
        for shift in week_shifts:
            try:
                start_time = datetime.strptime(shift.shift_start, "%H:%M").time()
                end_time = datetime.strptime(shift.shift_end, "%H:%M").time()
                start_datetime = datetime.combine(datetime.today(), start_time)
                end_datetime = datetime.combine(datetime.today(), end_time)
                if end_datetime < start_datetime:
                    end_datetime += timedelta(days=1)
                week_total += (end_datetime - start_datetime).total_seconds() / 3600
            except ValueError:
                continue

        weekly_hours.append(WeeklyHours(week=f"Week {week_num}", hours=week_total))

        current_week_start += timedelta(days=7)
        week_num += 1
    employee_punch_query = db.query(EmployeePunch).filter(
        EmployeePunch.organization_id == organization_id
    )
    # Note: Employee punches are not filtered by worksite since users don't have worksite_id
    # Worksite filtering is done through shifts, not punches
    if month:
        employee_punch_query = employee_punch_query.filter(
            func.substr(EmployeePunch.date, 1, 7) == month
        )

    overtime_hours = sum(
        punch.overtime_hours or 0 for punch in employee_punch_query.all()
    )

    payslip_query = db.query(Payslip).filter(Payslip.organization_id == organization_id)
    # Note: Payslips are not filtered by worksite since users don't have worksite_id
    if month:
        payslip_query = payslip_query.filter(
            func.substr(Payslip.period_start, 1, 7) == month
        )

    total_payments = sum(payslip.net_pay or 0 for payslip in payslip_query.all())

    total_absent = (
        db.query(EmployeePunch)
        .filter(
            EmployeePunch.organization_id == organization_id,
            EmployeePunch.punch_in_time.is_(None),
        )
        .count()
    )

    total_no_shows = (
        db.query(EmployeePunch)
        .filter(
            EmployeePunch.organization_id == organization_id,
            EmployeePunch.punch_in_time.is_(None),
            EmployeePunch.punch_out_time.is_(None),
        )
        .count()
    )
    no_show_query = (
        db.query(Shift.employee_id)
        .outerjoin(
            EmployeePunch,
            and_(
                EmployeePunch.shift_id == Shift.id,
            ),
        )
        .filter(
            Shift.organization_id == organization_id,
            EmployeePunch.id.is_(None),  # No matching punch record
        )
    )

    if month:
        no_show_query = no_show_query.filter(func.substr(Shift.date, 1, 7) == month)

    total_no_shows = no_show_query.count()

    payable_hours = total_hours

    average_hours_per_employee = (
        total_hours / total_employees if total_employees > 0 else 0
    )

    # Simplified top performers query for SQLite compatibility
    top_performers_query = (
        db.query(
            User.id.label("employee_id"),
            User.full_name.label("full_name"),
            func.count(Shift.id).label("total_shifts"),
            func.sum(func.coalesce(EmployeePunch.overtime_hours, 0)).label(
                "total_overtime"
            ),
        )
        .join(Shift, User.id == Shift.employee_id)
        .outerjoin(EmployeePunch, EmployeePunch.employee_id == User.id)
        .filter(Shift.organization_id == organization_id)
    )

    if worksite_id:
        top_performers_query = top_performers_query.filter(
            Shift.worksite_id == worksite_id
        )

    if month:
        top_performers_query = top_performers_query.filter(
            func.substr(Shift.date, 1, 7) == month
        )

    top_performers_query = (
        top_performers_query.group_by(User.id, User.full_name)
        .order_by(func.count(Shift.id).desc())
        .limit(5)
    )

    top_performers = [
        EmployeePerformance(
            employee_id=row.employee_id,
            full_name=row.full_name,
            total_hours=row.total_shifts * 8 or 0,  # Approximate hours based on shifts
            total_overtime=row.total_overtime or 0,
        )
        for row in top_performers_query.all()
    ]

    response = MonthlyWorksiteSummaryResponse(
        total_employees=total_employees,
        total_inactive_employees=total_inactive_employees,
        total_hours=total_hours,
        total_leave_hours=total_hours,
        total_payments=total_payments,
        total_absent=total_absent,
        total_overtime=overtime_hours,
        total_no_shows=total_no_shows,
        payable_hours=payable_hours,
        average_hours_per_employee=round(average_hours_per_employee, 2),
        top_performers=top_performers,
        weekly_hours=weekly_hours,
    )

    return response


def _get_weeks_in_month(year: int, month: int) -> int:
    first_day = datetime(year, month, 1)
    last_day = (
        (datetime(year, month + 1, 1) - timedelta(days=1))
        if month < 12
        else datetime(year + 1, 1, 1) - timedelta(days=1)
    )

    first_week = first_day.isocalendar()[1]
    last_week = last_day.isocalendar()[1]

    if month == 1:
        return last_week - first_week + 1
    else:
        return (
            last_week - first_week + 1
            if last_week >= first_week
            else (52 - first_week + 1) + last_week
        )
