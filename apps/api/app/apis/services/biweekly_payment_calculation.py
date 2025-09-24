from typing import Dict, Any, List
from sqlalchemy.orm import Session
from collections import defaultdict
from app.models.weeklyhours import WeeklyHours
from app.models.user import User

def calculate_biweekly_payslip(
    db: Session,
    organization_id: int,
    period_start: str,
    period_end: str,
    province: str = "ON"
) -> List[Dict[str, Any]]:
    """
    Calculate biweekly payslip with correct tax bracket calculations for all employees
    (treats all as hourly for calculation purposes)
    """
    print(f"\n=== Starting payslip calculation for organization {organization_id} ===")
    print(f"Period: {period_start} to {period_end}")
    print(f"Province: {province}\n")

    # Fetch weekly hours with employee data
    weekly_hours = db.query(
        WeeklyHours,
        User.full_name,
        User.payrate,
        User.pay_type
    ).join(
        User, WeeklyHours.employee_id == User.id
    ).filter(
        WeeklyHours.organization_id == organization_id,
        WeeklyHours.week_start <= period_end,
        WeeklyHours.week_end >= period_start,
    ).all()

    if not weekly_hours:
        print("No weekly hours found for this period")
        return []

    print(f"Found {len(weekly_hours)} weekly hour records")
    
    # Group data by employee
    employee_data = defaultdict(lambda: {
        "total_scheduled_hours": 0.0,
        "total_worked_hours": 0.0,
        "total_overtime_hours": 0.0,
        "employee_name": "",
        "payrate": 0.0,
        "pay_type": "HOURLY"  # Treat all as hourly for calculation
    })

    for wh, name, payrate, pay_type in weekly_hours:
        emp_data = employee_data[wh.employee_id]
        emp_data["total_scheduled_hours"] += wh.scheduled_hours or 0
        emp_data["total_worked_hours"] += wh.worked_hours or 0
        emp_data["total_overtime_hours"] += wh.overtime_hours or 0
        emp_data["employee_name"] = name
        emp_data["payrate"] = payrate
        # Force all employees to be treated as hourly
        emp_data["pay_type"] = "HOURLY"

    print("\n=== Employee Hours Summary ===")
    for emp_id, data in employee_data.items():
        print(f"\nEmployee ID: {emp_id}")
        print(f"Name: {data['employee_name']}")
        print(f"Pay Rate: ${data['payrate']:.2f}")
        print(f"Total Scheduled Hours: {data['total_scheduled_hours']:.2f}")
        print(f"Total Worked Hours: {data['total_worked_hours']:.2f}")
        print(f"Total Overtime Hours: {data['total_overtime_hours']:.2f}")

    # Tax configuration (2023 values)
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
            "rate": 0.0595,
            "max_earnings": 66600,
            "exemption": 3500
        },
        "ei": {
            "rate": 0.0163,
            "max_earnings": 61500
        },
        "basic_personal_amount": 15000
    }

    print("\n=== Tax Configuration ===")
    print("Federal Tax Brackets:", tax_config["federal"])
    print(f"Provincial Tax Brackets ({province}):", tax_config["provincial"][province])
    print(f"CPP Rate: {tax_config['cpp']['rate']*100}% on earnings up to ${tax_config['cpp']['max_earnings']}")
    print(f"EI Rate: {tax_config['ei']['rate']*100}% on earnings up to ${tax_config['ei']['max_earnings']}")
    print(f"Basic Personal Amount: ${tax_config['basic_personal_amount']}")

    payslips = []
    for employee_id, data in employee_data.items():
        print(f"\n=== Calculating payslip for Employee {employee_id} ===")
        
        # Calculate gross income (treat all as hourly)
        regular_hours = data["total_worked_hours"] - data["total_overtime_hours"]
        regular_pay = regular_hours * data["payrate"]
        overtime_pay = data["total_overtime_hours"] * data["payrate"] * 1.5
        gross_income = regular_pay + overtime_pay
        
        print(f"\nHourly Employee Calculation:")
        print(f"Regular Hours: {regular_hours:.2f} * ${data['payrate']:.2f} = ${regular_pay:.2f}")
        print(f"Overtime Hours: {data['total_overtime_hours']:.2f} * ${data['payrate']:.2f} * 1.5 = ${overtime_pay:.2f}")
        print(f"Gross Income: ${gross_income:.2f}")

        # Calculate deductions
        cpp_earnings = min(gross_income, (tax_config["cpp"]["max_earnings"] - tax_config["cpp"]["exemption"]) / 26)
        cpp_contributions = max(0, cpp_earnings * tax_config["cpp"]["rate"])
        
        ei_earnings = min(gross_income, tax_config["ei"]["max_earnings"] / 26)
        ei_premiums = ei_earnings * tax_config["ei"]["rate"]

        # Calculate taxes
        def calculate_tax(income, brackets):
            tax = 0
            remaining_income = income
            prev_bracket = 0
            
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

        # Apply Basic Personal Amount tax credit
        basic_credit = tax_config["basic_personal_amount"] / 26
        federal_tax = max(0, federal_tax - (basic_credit * 0.15))
        provincial_tax = max(0, provincial_tax - (basic_credit * 0.0505))
        
        # Net pay calculation
        total_tax = federal_tax + provincial_tax
        net_pay = gross_income - total_tax - cpp_contributions - ei_premiums
        
        payslips.append({
            "employee_id": employee_id,
            "employee_name": data["employee_name"],
            "organization_id": organization_id,
            "period_start": period_start,
            "period_end": period_end,
            "total_scheduled_hours": round(data["total_scheduled_hours"], 2),
            "total_worked_hours": round(data["total_worked_hours"], 2),
            "total_overtime_hours": round(data["total_overtime_hours"], 2),
            "regular_pay": round(regular_pay, 2),
            "overtime_pay": round(overtime_pay, 2),
            "gross_income": round(gross_income, 2),
            "federal_tax": round(federal_tax, 2),
            "provincial_tax": round(provincial_tax, 2),
            "cpp_contributions": round(cpp_contributions, 2),
            "ei_premiums": round(ei_premiums, 2),
            "net_pay": round(net_pay, 2),
            "pay_type": "HOURLY",  # All treated as hourly
            "hourly_rate": round(data["payrate"], 2),
        })

    print("\n=== Payslip Calculation Complete ===")
    print(f"Generated {len(payslips)} payslips")
    return payslips