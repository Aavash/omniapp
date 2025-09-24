import datetime
from re import I
from typing import Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session
from app.models.shift import Shift
from app.models.user import User
from app.apis.dtos.shift import (
    ShiftCreateSchema,
    ShiftEditSchema,
    ShiftResponse,
    SwapEmployeeSchema,
)
from app.models.worksite import WorkSite


def get_shift_by_id(db: Session, shift_id: int, organization_id: int) -> Shift:
    shift = (
        db.query(Shift)
        .filter(Shift.id == shift_id)
        .filter(Shift.organization_id == organization_id)
        .first()
    )
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Shift not found"
        )
    return shift


def get_shift_response_by_id(db: Session, shift_id: int, organization_id: int) -> Shift:
    shift = (
        db.query(Shift, WorkSite.name.label("worksite_name"))
        .join(WorkSite, Shift.worksite_id == WorkSite.id)
        .filter(Shift.id == shift_id)
        .first()
    )

    shift_instance, worksite_name = shift
    shift_instance.worksite_name = worksite_name
    return shift_instance


def has_overlapping_shift(
    db: Session, shift_data, current_user, check_employee_id=None
) -> bool:
    """
    Checks if the given shift_data overlaps with any existing shifts
    for the same employee on the same date within the same organization.

    :param db: Database session
    :param shift_data: Object containing shift_start, shift_end, employee_id, and date
    :param current_user: User object containing organization_id
    :return: True if there is an overlapping shift, otherwise False
    """
    employee_id = check_employee_id if check_employee_id else shift_data.employee_id
    overlapping_shift = (
        db.query(Shift)
        .filter(
            Shift.employee_id == employee_id,
            Shift.date == shift_data.date,
            Shift.organization_id == current_user.organization_id,
            or_(
                and_(
                    Shift.shift_start <= shift_data.shift_start,
                    shift_data.shift_start < Shift.shift_end,
                ),
                and_(
                    Shift.shift_start < shift_data.shift_end,
                    shift_data.shift_end <= Shift.shift_end,
                ),
                and_(
                    shift_data.shift_start <= Shift.shift_start,
                    shift_data.shift_end >= Shift.shift_end,
                ),
            ),
        )
        .first()
    )

    return overlapping_shift


def create_shift(
    db: Session, shift_data: ShiftCreateSchema, current_user: User
) -> Shift:
    overlapping_shifts = has_overlapping_shift(db, shift_data, current_user)
    if overlapping_shifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The new shift overlaps with an existing shift for this employee",
        )

    new_shift = Shift(
        title=shift_data.title,
        employee_id=shift_data.employee_id,
        worksite_id=shift_data.worksite_id,
        organization_id=current_user.organization_id,
        date=shift_data.date,
        shift_start=shift_data.shift_start,
        shift_end=shift_data.shift_end,
        remarks=shift_data.remarks,
        called_in=False,
    )

    db.add(new_shift)
    db.commit()
    db.refresh(new_shift)
    return new_shift


def edit_shift(
    db: Session, shift_id: int, shift_data: ShiftEditSchema, current_user: User
) -> Shift:
    existing_shift = get_shift_by_id(db, shift_id, current_user.organization_id)

    if existing_shift.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit shifts in your organization",
        )

    overlapping_shifts = has_overlapping_shift(db, shift_data, current_user)

    if overlapping_shifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The edited shift would overlap with an existing shift for this employee",
        )

    existing_shift.date = shift_data.date
    existing_shift.shift_start = shift_data.shift_start
    existing_shift.shift_end = shift_data.shift_end
    existing_shift.worksite_id = shift_data.worksite_id
    existing_shift.remarks = shift_data.remarks

    db.commit()
    db.refresh(existing_shift)
    return existing_shift


def swap_emplopyee_shift(
    db: Session, shift_id: int, shift_data: SwapEmployeeSchema, current_user: User
) -> Shift:
    existing_shift = get_shift_by_id(db, shift_id, current_user.organization_id)

    if existing_shift.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit shifts in your organization",
        )

    overlapping_shifts = has_overlapping_shift(
        db,
        existing_shift,
        current_user,
        check_employee_id=shift_data.replacement_employee_id,
    )

    if overlapping_shifts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The edited shift would overlap with an existing shift for this employee",
        )

    existing_shift.employee_id = shift_data.replacement_employee_id
    existing_shift.called_in = False
    existing_shift.call_in_reason = ""

    db.commit()
    db.refresh(existing_shift)
    return existing_shift


def delete_shift(db: Session, shift_id: int, current_user: User):
    existing_shift = get_shift_by_id(db, shift_id, current_user.organization_id)

    if existing_shift.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete shifts in your organization",
        )

    db.delete(existing_shift)
    db.commit()


def list_shifts(
    db: Session,
    organization_id: int,
    employee_id: Optional[int] = None,
    worksite_id: Optional[int] = None,
    week_start: Optional[str] = None,
    week_end: Optional[str] = None,
    page: int = 1,
    per_page: int = 10,
    search_query: Optional[str] = None,
    called_in: Optional[bool] = None,
    sort_by: Optional[str] = "id",
    sort_order: Optional[str] = "asc",
) -> Dict[str, Any]:
    """
    Fetch shifts for an organization, optionally filtered by employee, worksite, week range, search query, and sorted.
    Include worksite_name by joining the Shift table with the WorkSite table.
    Returns a dictionary with shifts and pagination metadata.
    """
    # Return empty list if neither week_start nor week_end is provided
    if week_start is None and week_end is None:
        return {
            "pagination": {
                "total_items": 0,
                "total_pages": 0,
                "current_page": page,
                "per_page": per_page,
                "has_next_page": False,
                "has_previous_page": page > 1,
            },
            "data": [],
        }

    query = (
        db.query(
            Shift.id,
            Shift.employee_id,
            Shift.title,
            Shift.date,
            Shift.shift_start,
            Shift.shift_end,
            Shift.called_in,
            Shift.call_in_reason,
            Shift.remarks,
            WorkSite.id.label("worksite_id"),
            WorkSite.name.label("worksite_name"),
        )
        .join(WorkSite, Shift.worksite_id == WorkSite.id)
        .filter(Shift.organization_id == organization_id)
    )

    # Filter by employee_id if provided
    if employee_id:
        query = query.filter(Shift.employee_id == employee_id)

    # Filter by worksite_id if provided
    if worksite_id:
        query = query.filter(Shift.worksite_id == worksite_id)

    # Filter by week range if provided
    if week_start and week_end:
        query = query.filter(Shift.date >= week_start, Shift.date <= week_end)

    # Apply search query filter
    if search_query:
        query = query.filter(Shift.remarks.ilike(f"%{search_query}%"))

    # Apply sorting
    if sort_by and hasattr(Shift, sort_by):
        column = getattr(Shift, sort_by)
        if sort_order == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())
    else:
        query = query.order_by(Shift.id.asc())

    # Count total number of items (for pagination metadata)
    total_items = query.count()

    # Apply pagination
    shifts = query.offset((page - 1) * per_page).limit(per_page).all()

    # Add filter for call-ins
    if called_in:
        query = query.filter(Shift.called_in == called_in)
    # Convert each row to a dictionary
    shift_dicts = [
        {
            "id": row.id,
            "employee_id": row.employee_id,
            "title": row.title,
            "date": row.date,
            "shift_start": row.shift_start,
            "shift_end": row.shift_end,
            "remarks": row.remarks,
            "called_in": row.called_in,
            "call_in_reason": row.call_in_reason,
            "worksite_id": row.worksite_id,
            "worksite_name": row.worksite_name,
        }
        for row in shifts
    ]

    # Calculate total pages
    total_pages = (total_items + per_page - 1) // per_page

    # Build the response with shifts and pagination metadata
    response = {
        "pagination": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": per_page,
            "has_next_page": page < total_pages,
            "has_previous_page": page > 1,
        },
        "data": [ShiftResponse(**shift_dict) for shift_dict in shift_dicts],
    }

    return response


def list_call_ins(
    db: Session,
    organization_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    per_page: int = 10,
) -> Dict[str, Any]:
    query = (
        db.query(
            Shift.id,
            Shift.employee_id,
            User.full_name.label("employee_full_name"),
            Shift.title,
            Shift.date,
            Shift.shift_start,
            Shift.shift_end,
            Shift.called_in,
            Shift.call_in_reason,
            Shift.remarks,
            WorkSite.id.label("worksite_id"),
            WorkSite.name.label("worksite_name"),
        )
        .join(WorkSite, Shift.worksite_id == WorkSite.id)
        .join(User, Shift.employee_id == User.id)  # Join with User table
        .filter(Shift.organization_id == organization_id)
        .filter(Shift.called_in == True)
    )

    if not start_date and not end_date:
        today = datetime.date.today().isoformat()
        query = query.filter(Shift.date == today)
    else:
        if start_date:
            query = query.filter(Shift.date >= start_date)
        if end_date:
            query = query.filter(Shift.date <= end_date)

    query = query.order_by(Shift.date.asc(), Shift.shift_start.asc())

    total_items = query.count()
    shifts = query.offset((page - 1) * per_page).limit(per_page).all()

    shift_dicts = [
        {
            "id": row.id,
            "employee_id": row.employee_id,
            "employee_full_name": row.employee_full_name,
            "title": row.title,
            "date": row.date,
            "shift_start": row.shift_start,
            "shift_end": row.shift_end,
            "remarks": row.remarks,
            "called_in": row.called_in,
            "call_in_reason": row.call_in_reason,
            "worksite_id": row.worksite_id,
            "worksite_name": row.worksite_name,
        }
        for row in shifts
    ]

    total_pages = (total_items + per_page - 1) // per_page

    return {
        "pagination": {
            "total_items": total_items,
            "total_pages": total_pages,
            "current_page": page,
            "per_page": per_page,
            "has_next_page": page < total_pages,
            "has_previous_page": page > 1,
        },
        "data": [ShiftResponse(**shift_dict) for shift_dict in shift_dicts],
    }
