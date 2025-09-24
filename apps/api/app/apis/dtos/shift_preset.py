from pydantic import BaseModel, ConfigDict
from typing import List, Optional


class ShiftPresetCreateSchema(BaseModel):
    employee_id: int
    preset_group_id: int
    title: str
    day_of_week: int
    shift_start: str
    shift_end: str
    remarks: Optional[str] = None


class ShiftPresetEditSchema(BaseModel):
    title: Optional[str] = None
    preset_group_id: int
    day_of_week: Optional[int] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    remarks: Optional[str] = None


class ShiftPresetResponse(BaseModel):
    id: int
    employee_id: int
    title: str
    day_of_week: int
    shift_start: str
    shift_end: str
    remarks: Optional[str] = None


class ShiftPresetGroupCreateSchema(BaseModel):
    title: str
    worksite_id: int


class ShiftPresetGroupEditSchema(BaseModel):
    title: Optional[str] = None
    worksite_id: Optional[int] = None


class ShiftPresetGroupResponse(BaseModel):
    id: int
    title: str
    worksite_id: int
    organization_id: int


class GetShiftPresetGroupResponse(BaseModel):
    id: int
    title: str
    worksite_name: str
    worksite_id: int
    organization_id: int


class ShiftPresetGroupAnalytics(BaseModel):
    total_shift_hours: float
    total_employees_scheduled: int


class ShiftPresetGroupListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    worksite_id: int
    worksite_name: str
    organization_id: int
    analytics: ShiftPresetGroupAnalytics


class PaginatedShiftPresetGroupResponse(BaseModel):
    groups: List[ShiftPresetGroupListResponse]
    total_groups: int
    total_pages: int
    current_page: int
    per_page: int


class PopulateShiftsRequest(BaseModel):
    preset_group_id: int
    dates: List[str]
    employee_ids: List[int]
    apply_to_week: bool


class ShiftModelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_time: str
    end_time: str
    employee_id: int
