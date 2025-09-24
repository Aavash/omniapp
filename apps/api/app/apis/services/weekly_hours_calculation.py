from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.weeklyhours import WeeklyHours  # Assuming you have this model
from app.models.shift import Shift
from app.models.shift import EmployeePunch


def calculate_weekly_hours(
    db: Session,
    employee_id: int,
    organization_id: int,
    week_start: str,
    week_end: str,
) -> dict[str, any]:
    """
    Calculate weekly hours (scheduled, worked, and overtime) and store them in the database.
    """
    # Fetch shifts and punches for the week
    shifts = (
        db.query(Shift)
        .filter(
            Shift.employee_id == employee_id,
            Shift.organization_id == organization_id,
            Shift.date >= week_start,
            Shift.date <= week_end,
        )
        .all()
    )

    punches = (
        db.query(EmployeePunch)
        .filter(
            EmployeePunch.employee_id == employee_id,
            EmployeePunch.organization_id == organization_id,
            EmployeePunch.date >= week_start,
            EmployeePunch.date <= week_end,
        )
        .all()
    )

    # Calculate scheduled hours
    scheduled_hours = sum(
        (
            datetime.strptime(shift.shift_end, "%H:%M")
            - datetime.strptime(shift.shift_start, "%H:%M")
        ).total_seconds()
        / 3600
        for shift in shifts
    )

    # Calculate worked hours
    worked_hours = sum(
        (
            datetime.strptime(punch.punch_out_time, "%H:%M")
            - datetime.strptime(punch.punch_in_time, "%H:%M")
        ).total_seconds()
        / 3600
        for punch in punches
    )

    # Calculate overtime hours
    overtime_hours = max(0, worked_hours - 40)

    # Convert string dates to date objects for SQLite compatibility
    if isinstance(week_start, str):
        week_start = datetime.strptime(week_start, "%Y-%m-%d").date()
    if isinstance(week_end, str):
        week_end = datetime.strptime(week_end, "%Y-%m-%d").date()

    # Store weekly hours in the database
    weekly_hours = WeeklyHours(
        employee_id=employee_id,
        organization_id=organization_id,
        week_start=week_start,
        week_end=week_end,
        scheduled_hours=scheduled_hours,
        worked_hours=worked_hours,
        overtime_hours=overtime_hours,
    )
    db.add(weekly_hours)
    db.commit()

    return {
        "employee_id": employee_id,
        "organization_id": organization_id,
        "week_start": week_start,
        "week_end": week_end,
        "scheduled_hours": scheduled_hours,
        "worked_hours": worked_hours,
        "overtime_hours": overtime_hours,
    }
