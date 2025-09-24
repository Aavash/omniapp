from pydantic import BaseModel
from typing import List


class EmployeePerformance(BaseModel):
    employee_id: int
    total_hours: float
    total_overtime: float
    full_name: str
    # total_leave_hours: float
    # total_no_shows: int


class WeeklyHours(BaseModel):
    week: str
    hours: float


class MonthlyWorksiteSummaryResponse(BaseModel):
    total_employees: int
    total_inactive_employees: int
    total_hours: float
    total_payments: float
    total_absent: int
    total_overtime: float
    total_leave_hours: float
    total_no_shows: int
    payable_hours: float
    average_hours_per_employee: float
    top_performers: List[EmployeePerformance]
    weekly_hours: List[WeeklyHours]
