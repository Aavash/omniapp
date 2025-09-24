from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from fastapi import status

from app.apis.dtos.summary import MonthlyWorksiteSummaryResponse
from app.apis.services.summary import calculate_monthly_worksite_summary
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user

summary_router = APIRouter(prefix="/summary", tags=["summary"])


@summary_router.get("/monthly-worksite", response_model=MonthlyWorksiteSummaryResponse)
def get_monthly_worksite_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    worksite_id: Optional[int] = None,
    month: Optional[str] = Query(None, description="Month in YYYY-MM format"),
):
    try:
        response = calculate_monthly_worksite_summary(
            db,
            organization_id=current_user.organization_id,
            worksite_id=worksite_id,
            month=month,
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return response
