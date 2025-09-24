from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.services.biweekly_payment_calculation import calculate_biweekly_payslip
from datetime import datetime
from typing import List

employee_payslip_router = APIRouter(prefix="/employee/payslip", tags=["employee_payslip"])

@employee_payslip_router.get("/biweekly")
def get_employee_biweekly_payslip(
    period_start: str = Query(..., description="Start of the period (YYYY-MM-DD)"),
    period_end: str = Query(..., description="End of the period (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:  # Changed return type annotation
    """
    Get biweekly payslip for the current employee only
    
    Returns:
        dict: A dictionary containing the payslip details for the period
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

    # Calculate all payslips but filter for current employee only
    all_payslips = calculate_biweekly_payslip(
        db,
        organization_id=current_user.organization_id,
        period_start=period_start,
        period_end=period_end,
    )
    
    employee_payslip = [p for p in all_payslips if p["employee_id"] == current_user.id]
    
    if not employee_payslip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payslip found for this period",
        )
    
    return employee_payslip[0]  # Return single payslip (should only be one per period)

@employee_payslip_router.get("/history")
def get_employee_payslip_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(12, description="Number of payslips to return"),
) -> List[dict]:
    """
    Get payslip history for the current employee (most recent first)
    """
    # This would require a new function or modifying your existing calculation
    # Here's a conceptual implementation:
    
    # 1. Get all weekly periods for the organization
    # 2. For each period, calculate payslip (or fetch from DB if stored)
    # 3. Filter for current employee and limit results
    
    # For now, we'll use the same calculation function but this should be optimized
    # in a real implementation to avoid recalculating everything
    
    # Get the last 6 months of data (approximate)
    from datetime import datetime, timedelta
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
    
    all_payslips = calculate_biweekly_payslip(
        db,
        organization_id=current_user.organization_id,
        period_start=start_date,
        period_end=end_date,
    )
    
    employee_payslips = [
        p for p in all_payslips 
        if p["employee_id"] == current_user.id
    ]
    
    # Sort by period_end date (newest first)
    employee_payslips.sort(
        key=lambda x: x["period_end"], 
        reverse=True
    )
    
    return employee_payslips[:limit]

@employee_payslip_router.get("/year-to-date")
def get_employee_ytd_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Get year-to-date summary for the current employee
    """
    # Calculate YTD values from January 1st of current year to today
    from datetime import datetime
    current_year = datetime.now().year
    start_date = f"{current_year}-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")
    
    all_payslips = calculate_biweekly_payslip(
        db,
        organization_id=current_user.organization_id,
        period_start=start_date,
        period_end=end_date,
    )
    
    employee_payslips = [
        p for p in all_payslips 
        if p["employee_id"] == current_user.id
    ]
    
    if not employee_payslips:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No payslips found for this year",
        )
    
    # Calculate YTD totals
    ytd_gross = sum(p["gross_income"] for p in employee_payslips)
    ytd_tax = sum(p["federal_tax"] + p["provincial_tax"] for p in employee_payslips)
    ytd_cpp = sum(p["cpp_contributions"] for p in employee_payslips)
    ytd_ei = sum(p["ei_premiums"] for p in employee_payslips)
    ytd_net = sum(p["net_pay"] for p in employee_payslips)
    
    return {
        "year": current_year,
        "start_date": start_date,
        "end_date": end_date,
        "total_payslips": len(employee_payslips),
        "total_gross_income": round(ytd_gross, 2),
        "total_taxes": round(ytd_tax, 2),
        "total_cpp_contributions": round(ytd_cpp, 2),
        "total_ei_premiums": round(ytd_ei, 2),
        "total_net_pay": round(ytd_net, 2),
        "average_net_per_pay": round(ytd_net / len(employee_payslips), 2) if employee_payslips else 0,
        "payslips": employee_payslips,
    }