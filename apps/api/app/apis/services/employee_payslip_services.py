from typing import Dict, List, Optional, Union
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from collections import defaultdict
from app.models.weeklyhours import WeeklyHours
from app.models.user import User
from app.models.payslip import Payslip as PayslipModel  # Assuming you have a Payslip model

def calculate_employee_biweekly_payslip(
    db: Session,
    employee_id: int,
    period_start: Union[str, date],
    period_end: Union[str, date],
    province: str = "ON"
) -> Dict[str, any]:
    """
    Calculate biweekly payslip for a single employee with correct tax bracket calculations
    """
    # Convert string dates to date objects if needed
    if isinstance(period_start, str):
        period_start = datetime.strptime(period_start, "%Y-%m-%d").date()
    if isinstance(period_end, str):
        period_end = datetime.strptime(period_end, "%Y-%m-%d").date()

    # Check if payslip already exists in database
    existing_payslip = db.query(PayslipModel).filter(
        PayslipModel.employee_id == employee_id,
        PayslipModel.period_start == period_start,
        PayslipModel.period_end == period_end
    ).first()
    
    if existing_payslip:
        return existing_payslip.to_dict()  # Assuming you have a to_dict method

    # Fetch employee details
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise ValueError(f"Employee with ID {employee_id} not found")

    # Fetch weekly hours for this employee only
    weekly_hours = db.query(WeeklyHours).filter(
        WeeklyHours.employee_id == employee_id,
        WeeklyHours.week_start <= period_end,
        WeeklyHours.week_end >= period_start,
    ).all()

    if not weekly_hours:
        return {}

    # Calculate totals
    totals = {
        "total_scheduled_hours": 0.0,
        "total_worked_hours": 0.0,
        "total_overtime_hours": 0.0,
    }

    for wh in weekly_hours:
        totals["total_scheduled_hours"] += wh.scheduled_hours or 0
        totals["total_worked_hours"] += wh.worked_hours or 0
        totals["total_overtime_hours"] += wh.overtime_hours or 0

    # Tax configuration (updated to 2024 values)
    tax_config = {
        "federal": [
            (53359, 0.15),
            (106717, 0.205),
            (165430, 0.26),
            (235675, 0.29),
            (float("inf"), 0.33)
        ],
        "provincial": {
            "ON": [
                (49231, 0.0505),
                (98463, 0.0915),
                (150000, 0.1116),
                (220000, 0.1216),
                (float("inf"), 0.1316)
            ],
        },
        "cpp": {
            "rate": 0.0595,  # 5.95% for 2024
            "max_earnings": 68400,  # 2024 amount
            "exemption": 3500
        },
        "ei": {
            "rate": 0.0163,  # 1.63% for 2024
            "max_earnings": 63100  # 2024 amount
        },
        "basic_personal_amount": 15000
    }

    # Calculate gross income
    regular_hours = totals["total_worked_hours"] - totals["total_overtime_hours"]
    regular_pay = regular_hours * employee.payrate
    overtime_pay = totals["total_overtime_hours"] * employee.payrate * 1.5
    gross_income = regular_pay + overtime_pay

    # Calculate deductions
    cpp_earnings = min(gross_income, (tax_config["cpp"]["max_earnings"] - tax_config["cpp"]["exemption"]) / 26)
    cpp_contributions = max(0, cpp_earnings * tax_config["cpp"]["rate"])
    
    ei_earnings = min(gross_income, tax_config["ei"]["max_earnings"] / 26)
    ei_premiums = ei_earnings * tax_config["ei"]["rate"]

    # Calculate taxes
    def calculate_tax(income: float, brackets: List[Tuple[float, float]]) -> float:
        tax = 0.0
        remaining_income = income
        prev_bracket = 0.0
        
        for bracket, rate in brackets:
            if remaining_income <= 0:
                break
            bracket_amount = min(remaining_income, bracket - prev_bracket)
            tax += bracket_amount * rate
            remaining_income -= bracket_amount
            prev_bracket = bracket
        return tax

    annual_income = gross_income * 26
    federal_tax = calculate_tax(annual_income, tax_config["federal"]) / 26
    provincial_tax = calculate_tax(annual_income, tax_config["provincial"][province]) / 26

    # Apply tax credits
    basic_credit = tax_config["basic_personal_amount"] / 26
    federal_tax = max(0, federal_tax - (basic_credit * 0.15))
    provincial_tax = max(0, provincial_tax - (basic_credit * 0.0505))
    
    # Net pay calculation
    total_tax = federal_tax + provincial_tax
    net_pay = gross_income - total_tax - cpp_contributions - ei_premiums
    
    payslip_data = {
        "employee_id": employee_id,
        "employee_name": employee.full_name,
        "organization_id": employee.organization_id,
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "total_scheduled_hours": round(totals["total_scheduled_hours"], 2),
        "total_worked_hours": round(totals["total_worked_hours"], 2),
        "total_overtime_hours": round(totals["total_overtime_hours"], 2),
        "regular_pay": round(regular_pay, 2),
        "overtime_pay": round(overtime_pay, 2),
        "gross_income": round(gross_income, 2),
        "federal_tax": round(federal_tax, 2),
        "provincial_tax": round(provincial_tax, 2),
        "cpp_contributions": round(cpp_contributions, 2),
        "ei_premiums": round(ei_premiums, 2),
        "net_pay": round(net_pay, 2),
        "pay_type": "HOURLY",
        "hourly_rate": round(employee.payrate, 2),
    }

    # Store the payslip in database
    payslip = PayslipModel(**payslip_data)
    db.add(payslip)
    db.commit()
    
    return payslip_data

def get_employee_payslip_history(
    db: Session,
    employee_id: int,
    limit: Optional[int] = 12,
    months_back: Optional[int] = None
) -> List[Dict[str, any]]:
    """
    Get payslip history for an employee (most recent first)
    Defaults to last 12 payslips or can specify months_back
    """
    query = db.query(PayslipModel).filter(
        PayslipModel.employee_id == employee_id
    ).order_by(PayslipModel.period_end.desc())
    
    if months_back:
        cutoff_date = datetime.now() - timedelta(days=30*months_back)
        query = query.filter(PayslipModel.period_end >= cutoff_date)
    
    if limit:
        query = query.limit(limit)
    
    payslips = query.all()
    return [p.to_dict() for p in payslips]

def get_employee_ytd_summary(
    db: Session,
    employee_id: int,
    year: Optional[int] = None
) -> Dict[str, any]:
    """
    Get year-to-date summary for an employee using stored payslips
    """
    year = year or datetime.now().year
    start_date = date(year, 1, 1)
    end_date = datetime.now().date()
    
    # Get payslips for this year
    payslips = db.query(PayslipModel).filter(
        PayslipModel.employee_id == employee_id,
        PayslipModel.period_start >= start_date,
        PayslipModel.period_end <= end_date
    ).all()
    
    if not payslips:
        return {
            "year": year,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_payslips": 0,
            "total_gross_income": 0,
            "total_taxes": 0,
            "total_cpp_contributions": 0,
            "total_ei_premiums": 0,
            "total_net_pay": 0,
            "average_net_per_pay": 0,
        }
    
    # Calculate YTD totals
    ytd_gross = sum(p.gross_income for p in payslips)
    ytd_tax = sum(p.federal_tax + p.provincial_tax for p in payslips)
    ytd_cpp = sum(p.cpp_contributions for p in payslips)
    ytd_ei = sum(p.ei_premiums for p in payslips)
    ytd_net = sum(p.net_pay for p in payslips)
    
    return {
        "year": year,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "total_payslips": len(payslips),
        "total_gross_income": round(ytd_gross, 2),
        "total_taxes": round(ytd_tax, 2),
        "total_cpp_contributions": round(ytd_cpp, 2),
        "total_ei_premiums": round(ytd_ei, 2),
        "total_net_pay": round(ytd_net, 2),
        "average_net_per_pay": round(ytd_net / len(payslips), 2) if payslips else 0,
    }