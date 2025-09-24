from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date as date_type
from app.apis.dtos.user import (
    AvailabilityCreateUpdate,
    AvailabilityResponse,
    AvailableEmployeesResponse,
    OrganizationAvailabilityResponse,
)
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user

from app.apis.services.availability import (
    create_or_update_availability,
    get_availability,
    delete_availability,
    list_available_employees,
    list_organization_availability,
)

availability_router = APIRouter(prefix="/availability", tags=["availability"])


@availability_router.put("/{user_id}", response_model=AvailabilityResponse)
def create_update_availability(
    user_id: int,
    availability_data: AvailabilityCreateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # try:
    return create_or_update_availability(
        db=db,
        user_id=user_id,
        availability_data=availability_data,
        current_user=current_user,
    )


@availability_router.get("/my-availability", response_model=AvailabilityResponse)
def get_availability_record(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        availability = get_availability(
            db, current_user.id, current_user.organization_id
        )
        return availability
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@availability_router.get("/list", response_model=OrganizationAvailabilityResponse)
def get_organization_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, le=100),
):
    try:
        return list_organization_availability(
            db=db,
            organization_id=current_user.organization_id,
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


@availability_router.delete("/delete", response_model=dict)
def delete_availability_record(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        delete_availability(db, current_user.id, current_user.organization_id)
        return {"message": "Availability record deleted successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@availability_router.get(
    "/available-employees", response_model=AvailableEmployeesResponse
)
def get_available_employees(
    date: str = Query(..., description="Target date in YYYY-MM-DD format"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, le=100),
):
    try:
        # Use the aliased date_type for conversion
        parsed_date = date_type.fromisoformat(date)
        return list_available_employees(
            db=db,
            organization_id=current_user.organization_id,
            date=parsed_date,
            page=page,
            per_page=per_page,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD",
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
