from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from app.apis.dtos.employee_schedule import DateFilter, EmployeeShiftResponse
from app.apis.services.employee_schedule_service import get_employee_schedules
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user  


employee_user_router = APIRouter(prefix="/employee-user", tags=["employee-user"])


@employee_user_router.get("/shifts", response_model=List[EmployeeShiftResponse])
def fetch_employee_schedules(
    start_date: Optional[str] = Query(
        None, description="Start date for filtering schedules (YYYY-MM-DD)"
    ),
    end_date: Optional[str] = Query(
        None, description="End date for filtering schedules (YYYY-MM-DD)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        date_filter = DateFilter(start_date=start_date, end_date=end_date)

        schedules = get_employee_schedules(
            db, current_user.id, date_filter.start_date, date_filter.end_date
        )
        return schedules
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
