from typing import Annotated, List, Optional
from fastapi import Query, status
from fastapi import APIRouter, Depends, HTTPException

from app.apis.dtos.user import (
    EditUserSchema,
    UserActivationRequest,
    UserCreateSchema,
    UserResponse,
)
from app.apis.services.user import (
    check_user_conflicts,
    check_user_exists,
    create_user,
    delete_user,
    edit_user,
    get_user_by_id,
    list_user,
)
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from sqlalchemy.orm import Session

employee_router = APIRouter(prefix="/employee", tags=["user"])


@employee_router.post(
    "/create", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def create_employee(
    user_data: UserCreateSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    # Only owners can create employees
    if not current_user.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can create employees",
        )

    try:
        existing_user = check_user_exists(db, user_data.email, user_data.phone_number)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with email or phone number already exists",
            )
        user_data.organization_id = current_user.organization_id
        new_user = create_user(db, user_data, current_user.organization_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    else:
        return new_user


@employee_router.put("/edit/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: EditUserSchema,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if user_data.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID mismatch",
        )

    try:
        existing_user = check_user_exists(
            db,
            user_data.email,
            user_data.phone_number,
        )
        if not existing_user.organization_id == current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Operation",
            )
        conflict_user = check_user_conflicts(db, user_data)
        if conflict_user and conflict_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with email already exists",
            )

        elif conflict_user and conflict_user.phone_number == user_data.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with phone number already exists",
            )
        updated_user = edit_user(db, user_data, existing_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    else:
        return updated_user


@employee_router.get("/list", response_model=List[UserResponse])
def get_employees(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, le=100, description="Items per page"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: Optional[str] = Query("id", description="Sort by column"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
):
    if not current_user.is_owner:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only owners can list users",
        )

    # Pass the organization_id of the current user
    users = list_user(
        db,
        organization_id=current_user.organization_id,  # Filter by organization
        page=page,
        per_page=per_page,
        search_query=search_query,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return users


@employee_router.get("/{employee_id}", response_model=UserResponse)
def get_employee(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get employee by ID."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Non-owners can only view their own data
    if not current_user.is_owner and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return employee


@employee_router.put("/{employee_id}", response_model=UserResponse)
def update_employee(
    employee_id: int,
    user_data: dict,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update employee by ID."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Non-owners can only update their own data
    if not current_user.is_owner and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Update employee fields
    for field, value in user_data.items():
        if hasattr(employee, field):
            setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


@employee_router.delete("/{employee_id}")
def delete_employee_by_id(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Delete employee by ID."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Only owners can delete employees
    if not current_user.is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can delete employees",
        )

    try:
        delete_user(db, employee)
        return {"message": "Employee deleted successfully"}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the employee",
        )


@employee_router.delete("/delete/{employee_id}", response_model=dict)
def delete_employee(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    existing_user = get_user_by_id(db, employee_id)
    if (
        not existing_user
        or existing_user.organization_id != current_user.organization_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid delete request",
        )
    try:
        delete_user(db, existing_user)
    except:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the employee",
        )
    return {"message": "Employee deleted successfully"}


@employee_router.put("/user-status/{user_id}", response_model=UserResponse)
def set_user_active_status(
    user_id: int,
    activation_data: UserActivationRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if target_user.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify user from another organization",
        )

    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status",
        )

    target_user.is_active = activation_data.is_active
    db.commit()
    db.refresh(target_user)

    return target_user


@employee_router.get("/{employee_id}/availability")
def get_employee_availability(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get employee availability."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Non-owners can only view their own availability
    if not current_user.is_owner and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Return empty availability for now - this would be implemented with actual availability service
    return {"employee_id": employee_id, "availability": {}}


@employee_router.get("/{employee_id}/schedule")
def get_employee_schedule(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get employee schedule."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Non-owners can only view their own schedule
    if not current_user.is_owner and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Return empty schedule for now - this would be implemented with actual schedule service
    return {"employee_id": employee_id, "schedule": []}


@employee_router.get("/{employee_id}/timesheet")
def get_employee_timesheet(
    employee_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Get employee timesheet."""
    employee = get_user_by_id(db, employee_id)
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found"
        )

    # Check if user belongs to same organization
    if employee.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Non-owners can only view their own timesheet
    if not current_user.is_owner and current_user.id != employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    # Return empty timesheet for now - this would be implemented with actual timesheet service
    return {"employee_id": employee_id, "timesheet": []}
