from datetime import datetime
from pydantic import BaseModel, field_validator
from typing import List, Optional


class ShiftCreateSchema(BaseModel):
    employee_id: int
    worksite_id: int
    title: str
    date: str
    shift_start: str
    shift_end: str
    remarks: Optional[str] = None

    @field_validator("date")
    def validate_date_format(cls, value):
        try:
            # Attempt to parse the date in YYYY-MM-DD format
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return value

    @field_validator("shift_start", "shift_end")
    def validate_time_format(cls, value):
        try:
            # Attempt to parse the time in HH:MM format
            datetime.strptime(value, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format")
        return value


class ShiftEditSchema(BaseModel):
    title: Optional[str] = None
    worksite_id: int
    employee_id: int
    date: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    remarks: Optional[str] = None

    @field_validator("date")
    def validate_date_format(cls, value):
        try:
            # Attempt to parse the date in YYYY-MM-DD format
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must be in YYYY-MM-DD format")
        return value

    @field_validator("shift_start", "shift_end")
    def validate_time_format(cls, value):
        try:
            # Attempt to parse the time in HH:MM format
            datetime.strptime(value, "%H:%M")
        except ValueError:
            raise ValueError("Time must be in HH:MM format")
        return value


class SwapEmployeeSchema(BaseModel):
    replacement_employee_id: int


class ShiftResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    date: str
    shift_start: str
    shift_end: str
    remarks: str
    worksite_id: int
    called_in: bool
    call_in_reason: Optional[str] = None
    employee_full_name: Optional[str] = None
    worksite_name: str


class PaginationMetadata(BaseModel):
    total_items: int
    total_pages: int
    current_page: int
    per_page: int
    has_next_page: bool
    has_previous_page: bool


class ShiftListResponse(BaseModel):
    data: List[ShiftResponse]
    pagination: PaginationMetadata


class CallInRequest(BaseModel):
    call_in_reason: str
