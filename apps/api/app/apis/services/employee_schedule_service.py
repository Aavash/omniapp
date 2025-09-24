from datetime import date
from typing import List, Optional
from sqlalchemy import Date, cast
from sqlalchemy.orm import Session, aliased
from app.apis.dtos.employee_schedule import EmployeeShiftResponse
from app.models.shift import EmployeePunch, Shift
from app.models.worksite import WorkSite
from sqlalchemy import and_


def get_employee_schedules(
    db: Session,
    employee_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
) -> List[EmployeeShiftResponse]:
    """
    Fetch schedules for a specific employee, optionally filtered by date range.
    Left join Shift table with EmployeePunch table to include punch data.
    Join Shift table with WorkSite table to include worksite_name.
    Directly map the query results to EmployeeShiftResponse without a for loop.
    """
    # Create aliases for the tables
    shift_alias = aliased(Shift)
    punch_alias = aliased(EmployeePunch)
    worksite_alias = aliased(WorkSite)

    query = (
        db.query(
            shift_alias.id,
            shift_alias.employee_id,
            shift_alias.title,
            shift_alias.date,
            shift_alias.shift_start,
            shift_alias.shift_end,
            punch_alias.punch_in_time.label("employee_punch_start"),
            punch_alias.punch_out_time.label("employee_punch_end"),
            shift_alias.remarks,
            worksite_alias.id.label("worksite_id"),
            worksite_alias.name.label("worksite_name"),
        )
        .outerjoin(  # Use outerjoin for a LEFT JOIN
            punch_alias,
            and_(
                shift_alias.employee_id == punch_alias.employee_id,
                shift_alias.date == punch_alias.date,
            ),
        )
        .join(  # Join with WorkSite
            worksite_alias, shift_alias.worksite_id == worksite_alias.id
        )
        .filter(shift_alias.employee_id == employee_id)
    )

    # Apply date filters if provided
    if start_date and end_date:
        query = query.filter(
            shift_alias.date >= start_date.isoformat(),
            shift_alias.date <= end_date.isoformat(),
        )
    elif start_date:
        query = query.filter(shift_alias.date >= start_date.isoformat())
    elif end_date:
        query = query.filter(shift_alias.date <= end_date.isoformat())

    # Execute the query and map results directly to EmployeeShiftResponse
    results = query.all()
    return [EmployeeShiftResponse(**row._asdict()) for row in results]
