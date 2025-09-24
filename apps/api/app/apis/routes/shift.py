import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.apis.services.user import get_user_by_id
from app.config.database import get_db
from app.models.shift import Shift
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.dtos.shift import (
    ShiftCreateSchema,
    ShiftEditSchema,
    ShiftListResponse,
    ShiftResponse,
    CallInRequest,
    SwapEmployeeSchema,
)
from app.apis.services.shift import (
    create_shift,
    edit_shift,
    delete_shift,
    get_shift_response_by_id,
    list_call_ins,
    list_shifts,
    swap_emplopyee_shift,
)

shift_router = APIRouter(prefix="/shift", tags=["shift"])


@shift_router.post("/create", response_model=ShiftResponse)
def create_new_shift(
    shift_data: ShiftCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        employee = get_user_by_id(db, shift_data.employee_id)
        if (
            current_user.is_owner
            and employee.organization_id != current_user.organization_id
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create shifts for yourself or employees in your organization",
            )
        new_shift = create_shift(db, shift_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    shift_response = get_shift_response_by_id(
        db, new_shift.id, current_user.organization_id
    )
    return shift_response


@shift_router.put("/edit/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: int,
    shift_data: ShiftEditSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        updated_shift = edit_shift(db, shift_id, shift_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    shift_response = get_shift_response_by_id(
        db, updated_shift.id, current_user.organization_id
    )
    return shift_response


@shift_router.put("/swap-employee/{shift_id}")
def swap_shift(
    shift_id: int,
    shift_data: SwapEmployeeSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        updated_shift = swap_emplopyee_shift(db, shift_id, shift_data, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    shift_response = get_shift_response_by_id(
        db, updated_shift.id, current_user.organization_id
    )
    return shift_response


@shift_router.delete("/delete/{shift_id}", response_model=dict)
def remove_shift(
    shift_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_shift(db, shift_id, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    else:
        return {"message": "Shift deleted successfully"}


@shift_router.get("/list", response_model=ShiftListResponse)
def get_shifts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    employee_id: Optional[int] = None,
    worksite_id: Optional[int] = None,
    week_start: Optional[str] = Query(
        None, description="Start of the week (YYYY-MM-DD)"
    ),
    week_end: Optional[str] = Query(None, description="End of the week (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, le=100, description="Items per page"),
    search_query: Optional[str] = Query(None, description="Search query"),
    sort_by: Optional[str] = Query("id", description="Sort by column"),
    sort_order: Optional[str] = Query("asc", description="Sort order (asc/desc)"),
):
    try:
        # Updated to return a response with pagination metadata
        response = list_shifts(
            db,
            organization_id=current_user.organization_id,
            employee_id=employee_id,
            worksite_id=worksite_id,
            week_start=week_start,
            week_end=week_end,
            page=page,
            per_page=per_page,
            search_query=search_query,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except HTTPException as e:
        print(e)
        raise e
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return response


@shift_router.post("/{shift_id}/call-in")
def call_in_shift(
    shift_id: int,
    call_in_data: CallInRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark a shift as a call-in with a reason.
    """
    shift = (
        db.query(Shift)
        .filter(
            Shift.id == shift_id, Shift.organization_id == current_user.organization_id
        )
        .first()
    )

    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    shift.called_in = True
    shift.call_in_reason = call_in_data.call_in_reason

    db.commit()
    db.refresh(shift)

    return shift


@shift_router.get("/call-ins", response_model=ShiftListResponse)
def get_call_ins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    date: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, le=100),
):
    try:
        if not date:
            today = datetime.date.today()
            start_date = today.isoformat()
            end_date = (today + datetime.timedelta(days=7)).isoformat()
        else:
            start_date = date
            end_date = (
                datetime.date.fromisoformat(date) + datetime.timedelta(days=7)
            ).isoformat()

        response = list_call_ins(
            db,
            organization_id=current_user.organization_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            per_page=per_page,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return response
