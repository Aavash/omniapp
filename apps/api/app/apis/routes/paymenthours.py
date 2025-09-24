from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.services.weekly_hours_calculation import calculate_weekly_hours
from app.apis.services.biweekly_payment_calculation import calculate_biweekly_payslip
from datetime import datetime

hours_router = APIRouter(prefix="/hours", tags=["hours"])
payslip_router = APIRouter(prefix="/payslip", tags=["payslip"])


@hours_router.post("/weekly")
def calculate_and_store_weekly_hours(
    week_start: str = Query(..., description="Start of the week (YYYY-MM-DD)"),
    week_end: str = Query(..., description="End of the week (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Calculate and store weekly hours for the current user.
    """
    try:
        # Validate date format
        datetime.strptime(week_start, "%Y-%m-%d")
        datetime.strptime(week_end, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    weekly_hours = calculate_weekly_hours(
        db,
        employee_id=current_user.id,
        organization_id=current_user.organization_id,
        week_start=week_start,
        week_end=week_end,
    )
    return weekly_hours


@payslip_router.get("/biweekly")
def get_biweekly_payslip(
    period_start: str = Query(..., description="Start of the period (YYYY-MM-DD)"),
    period_end: str = Query(..., description="End of the period (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch biweekly payslip for all employees in the organization.
    """
    try:
        # Validate date format
        datetime.strptime(period_start, "%Y-%m-%d")
        datetime.strptime(period_end, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD.",
        )

    payslips = calculate_biweekly_payslip(
        db,
        organization_id=current_user.organization_id,
        period_start=period_start,
        period_end=period_end,
    )
    return payslips