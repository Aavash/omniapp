from datetime import date
from typing import Optional
from pydantic import BaseModel, field_validator
from fastapi import Query


class EmployeeShiftResponse(BaseModel):
    id: Optional[int]
    employee_id: Optional[int]
    worksite_id: Optional[int]
    worksite_name: Optional[str]
    title: Optional[str]
    date: Optional[str]
    shift_start: Optional[str]
    shift_end: Optional[str]
    employee_punch_start: Optional[str] = None
    employee_punch_end: Optional[str] = None
    remarks: Optional[str] = None


class DateFilter(BaseModel):
    start_date: Optional[str] = Query(
        None, description="Start date for filtering schedules (YYYY-MM-DD)"
    )
    end_date: Optional[str] = Query(
        None, description="End date for filtering schedules (YYYY-MM-DD)"
    )

    @field_validator("start_date", "end_date")
    def validate_date_format(cls, value: str) -> str:
        if value is not None:
            try:
                date.fromisoformat(value)
            except ValueError:
                raise ValueError("Date must be in the format YYYY-MM-DD")
        return value
