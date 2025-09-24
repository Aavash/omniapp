from datetime import date, time
from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload
from app.apis.dtos.user import (
    AvailabilityCreateUpdate,
    AvailabilityResponse,
    AvailableEmployeeResponse,
    AvailableEmployeesResponse,
    EmployeeAvailabilityResponse,
    OrganizationAvailabilityResponse,
)
from app.models.shift import Shift
from app.models.user import Availability, User


def get_time_or_none(time_str: str) -> time | None:
    """Convert string to time object or return None if empty/invalid"""
    if not time_str:
        return None
    try:
        return time.fromisoformat(time_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid time format: {time_str}. Expected HH:MM or HH:MM:SS",
        )


def create_or_update_availability(
    db: Session,
    user_id: int,
    availability_data: AvailabilityCreateUpdate,
    current_user: User,
) -> AvailabilityResponse:
    # Verify target user exists and belongs to same organization
    target_user = (
        db.query(User)
        .filter(
            User.id == user_id, User.organization_id == current_user.organization_id
        )
        .first()
    )

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in organization",
        )

    # Check if availability already exists
    existing_availability = (
        db.query(Availability).filter(Availability.user_id == user_id).first()
    )

    # Prepare time fields
    time_fields = {}
    for day in [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
    ]:
        day_data = getattr(availability_data, day)
        time_fields[f"{day}_available"] = day_data.available
        time_fields[f"{day}_start"] = get_time_or_none(day_data.start_time)
        time_fields[f"{day}_end"] = get_time_or_none(day_data.end_time)

    if existing_availability:
        # Update existing record
        for field, value in time_fields.items():
            setattr(existing_availability, field, value)

        if availability_data.notes is not None:
            existing_availability.notes = availability_data.notes

        db.commit()
        db.refresh(existing_availability)
        return format_availability_response(db, existing_availability)
    else:
        # Create new record
        new_availability = Availability(
            user_id=user_id,
            **time_fields,
            notes=availability_data.notes,
        )

        db.add(new_availability)
        db.commit()
        db.refresh(new_availability)
        return format_availability_response(db, new_availability)


def get_availability(
    db: Session, user_id: int, organization_id: int
) -> AvailabilityResponse:
    availability = (
        db.query(Availability)
        .options(joinedload(Availability.user))
        .join(User, Availability.user_id == User.id)
        .filter(
            Availability.user_id == user_id, User.organization_id == organization_id
        )
        .first()
    )

    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability record not found",
        )

    return format_availability_response(db, availability)


def delete_availability(db: Session, user_id: int, organization_id: int) -> None:
    availability = (
        db.query(Availability)
        .join(User, Availability.user_id == User.id)
        .filter(
            Availability.user_id == user_id, User.organization_id == organization_id
        )
        .first()
    )

    if not availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Availability record not found",
        )

    db.delete(availability)
    db.commit()


def list_organization_availability(
    db: Session, organization_id: int, page: int = 1, per_page: int = 10
) -> OrganizationAvailabilityResponse:
    # Get all users in the organization with their availability
    users_with_availability = (
        db.query(User)
        .options(joinedload(User.availability))
        .filter(User.organization_id == organization_id)
        .order_by(User.full_name)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    if not users_with_availability:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No employees found in organization",
        )

    # Format the response
    employees = []
    for user in users_with_availability:
        if user.availability:
            employees.append(
                EmployeeAvailabilityResponse(
                    user_id=user.id,
                    user_name=user.full_name,
                    availability={
                        day.lower(): {
                            "available": getattr(
                                user.availability, f"{day.lower()}_available"
                            ),
                            "start_time": (
                                getattr(
                                    user.availability, f"{day.lower()}_start"
                                ).isoformat()
                                if getattr(user.availability, f"{day.lower()}_start")
                                else None
                            ),
                            "end_time": (
                                getattr(
                                    user.availability, f"{day.lower()}_end"
                                ).isoformat()
                                if getattr(user.availability, f"{day.lower()}_end")
                                else None
                            ),
                        }
                        for day in [
                            "monday",
                            "tuesday",
                            "wednesday",
                            "thursday",
                            "friday",
                            "saturday",
                            "sunday",
                        ]
                    },
                    notes=user.availability.notes,
                )
            )

    return OrganizationAvailabilityResponse(employees=employees)


def format_availability_response(
    db: Session, availability: Availability
) -> AvailabilityResponse:
    # Explicitly load the user if not already loaded
    if not hasattr(availability, "user") or availability.user is None:
        availability.user = db.query(User).get(availability.user_id)
        if not availability.user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated user not found",
            )

    return AvailabilityResponse(
        id=availability.id,
        user_id=availability.user_id,
        organization_id=availability.user.organization_id,
        user_name=availability.user.full_name,
        availability={
            day.lower(): {
                "available": getattr(availability, f"{day.lower()}_available"),
                "start_time": (
                    getattr(availability, f"{day.lower()}_start").isoformat()
                    if getattr(availability, f"{day.lower()}_start")
                    else None
                ),
                "end_time": (
                    getattr(availability, f"{day.lower()}_end").isoformat()
                    if getattr(availability, f"{day.lower()}_end")
                    else None
                ),
            }
            for day in [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ]
        },
        notes=availability.notes,
    )


def list_available_employees(
    db: Session,
    organization_id: int,
    date: date,
    page: int = 1,
    per_page: int = 10,
) -> AvailableEmployeesResponse:
    # Convert date to string for comparison with Shift.date
    date_str = date.isoformat()

    # Determine day of week for the target date
    day_of_week = date.strftime("%A").lower()

    # First, get all users who are already scheduled on this date
    scheduled_user_ids = [
        user_id
        for (user_id,) in db.query(Shift.employee_id)
        .filter(Shift.date == date_str)
        .distinct()
        .all()
    ]

    # Get all available users in the organization who aren't scheduled
    users = (
        db.query(User)
        .outerjoin(Availability, User.id == Availability.user_id)
        .filter(
            User.organization_id == organization_id,
            User.id.notin_(scheduled_user_ids) if scheduled_user_ids else True,
            # Check availability for the specific day
            or_(
                Availability.id == None,  # No availability record
                getattr(Availability, f"{day_of_week}_available") == True,
            ),
        )
        .order_by(User.full_name)
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No available employees found for this date",
        )

    # Format the response
    employees = []
    for user in users:
        # Get availability details
        available_start = None
        available_end = None

        if user.availability:
            available_start = getattr(user.availability, f"{day_of_week}_start")
            available_end = getattr(user.availability, f"{day_of_week}_end")

        employees.append(
            AvailableEmployeeResponse(
                user_id=user.id,
                user_name=user.full_name,
                is_available=True,  # All returned users are available
                is_scheduled=False,  # We explicitly excluded scheduled users
                available_start=available_start.isoformat()
                if available_start
                else None,
                available_end=available_end.isoformat() if available_end else None,
            )
        )

    return AvailableEmployeesResponse(
        date=date_str, day_of_week=day_of_week.capitalize(), employees=employees
    )
