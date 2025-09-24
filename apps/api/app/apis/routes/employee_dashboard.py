from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, List
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.services.employee_dashboard import DashboardService
from app.exceptions import CustomHTTPException

employee_dashboard_router = APIRouter(
    prefix="/employee/dashboard",
    tags=["employee_dashboard"]
)

@employee_dashboard_router.get("/", response_model=Dict[str, Any])
def get_employee_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get comprehensive dashboard data for the current employee
    
    Returns:
        dict: Contains all dashboard metrics including:
        - employeeInfo (name, payrate, payType)
        - weeklyHours (worked, scheduled, overtime)
        - monthlyHours (worked, scheduled, overtime)
        - yearlyHours (worked, scheduled, overtime)
        - notifications (list of messages)
    """
    try:
        return DashboardService.get_employee_dashboard(db, current_user.id)
    except CustomHTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard data: {str(e)}"
        )

@employee_dashboard_router.get("/weekly-history")
def get_weekly_history(
    weeks: int = Query(12, description="Number of weeks to return", ge=1, le=52),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get historical weekly hours data for the employee
    
    Returns:
        List of weekly records with:
        - week_start (date)
        - week_end (date)
        - worked_hours
        - scheduled_hours
        - overtime_hours
    """
    try:
        from datetime import timedelta
        end_date = datetime.now().date()
        start_date = end_date - timedelta(weeks=weeks)
        
        # This would require a new service method
        weekly_data = DashboardService.get_weekly_history(
            db,
            employee_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        return weekly_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch weekly history: {str(e)}"
        )

@employee_dashboard_router.get("/shift-schedule")
def get_upcoming_shifts(
    days: int = Query(14, description="Number of days to look ahead", ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """
    Get upcoming shift schedule for the employee
    
    Returns:
        List of shifts with:
        - date
        - start_time
        - end_time
        - location
        - status
    """
    try:
        # This would require a new service method
        shifts = DashboardService.get_upcoming_shifts(
            db,
            employee_id=current_user.id,
            days_ahead=days
        )
        
        return shifts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch shift schedule: {str(e)}"
        )