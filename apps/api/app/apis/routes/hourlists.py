from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Optional
from app.apis.dtos.worksite import Status
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.services.hourlist_service import calculate_employee_hours

employee_hours_router = APIRouter(prefix="/employee-hours", tags=["employee-hours"])


@employee_hours_router.get("/summary", response_model=List[Dict[str, Any]])
def get_employee_hours_summary(
    week_start: Optional[str] = Query(None, description="Start of the week (YYYY-MM-DD)"),
    week_end: Optional[str] = Query(None, description="End of the week (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch the total scheduled hours, worked hours, and overtime hours for each employee
    within a given date range.
    """
    try:
        employee_hours = calculate_employee_hours(
            db,
            organization_id=current_user.organization_id,
            week_start=week_start,
            week_end=week_end,
        )
        return employee_hours
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=Status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )