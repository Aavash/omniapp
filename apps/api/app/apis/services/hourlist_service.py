from typing import Any, Dict, List
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fastapi import HTTPException, status
from datetime import datetime
from app.models.shift import Shift
from app.models.shift import EmployeePunch
from app.models.user import User


def calculate_employee_hours(
    db: Session,
    organization_id: int,
    week_start: str,
    week_end: str,
) -> List[Dict[str, Any]]:
    """
    Calculate total scheduled hours, worked hours, and overtime hours for each employee
    within a given date range.
    Returns a list of dictionaries containing employee details and hours.
    If no records are found, returns an empty list.
    """
    # Get all shifts and punches for the date range
    shifts_query = (
        db.query(Shift, User.full_name)
        .join(User, User.id == Shift.employee_id)
        .filter(Shift.organization_id == organization_id)
        .filter(and_(Shift.date >= week_start, Shift.date <= week_end))
    ).all()

    punches_query = (
        db.query(EmployeePunch)
        .filter(EmployeePunch.organization_id == organization_id)
        .filter(and_(EmployeePunch.date >= week_start, EmployeePunch.date <= week_end))
    ).all()

    # Group data by employee
    employee_data = {}

    # Process shifts
    for shift, full_name in shifts_query:
        if shift.employee_id not in employee_data:
            employee_data[shift.employee_id] = {
                "name": full_name,
                "scheduled_hours": 0.0,
                "worked_hours": 0.0,
            }

        # Calculate scheduled hours (simple time difference)
        try:
            start_time = datetime.strptime(shift.shift_start, "%H:%M")
            end_time = datetime.strptime(shift.shift_end, "%H:%M")

            # Handle overnight shifts
            if end_time < start_time:
                end_time = end_time.replace(day=end_time.day + 1)

            hours = (end_time - start_time).total_seconds() / 3600
            employee_data[shift.employee_id]["scheduled_hours"] += hours
        except ValueError:
            # Skip invalid time formats
            continue

    # Process punches
    for punch in punches_query:
        if (
            punch.employee_id in employee_data
            and punch.punch_in_time
            and punch.punch_out_time
        ):
            try:
                punch_in = datetime.strptime(punch.punch_in_time, "%H:%M")
                punch_out = datetime.strptime(punch.punch_out_time, "%H:%M")

                # Handle overnight punches
                if punch_out < punch_in:
                    punch_out = punch_out.replace(day=punch_out.day + 1)

                hours = (punch_out - punch_in).total_seconds() / 3600
                employee_data[punch.employee_id]["worked_hours"] += hours
            except ValueError:
                # Skip invalid time formats
                continue

    # Convert to expected format
    employee_hours = []
    for employee_id, data in employee_data.items():
        scheduled = data["scheduled_hours"]
        worked = data["worked_hours"]
        overtime = max(0, worked - 40)  # Calculate overtime (worked hours > 40)

        employee_hours.append(
            {
                "employee": {"id": employee_id, "name": data["name"]},
                "scheduled_hours": scheduled,
                "worked_hours": worked,
                "overtime_hours": overtime,
            }
        )

    return employee_hours
