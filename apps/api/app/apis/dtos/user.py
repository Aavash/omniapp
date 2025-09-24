from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr, Field, computed_field, ConfigDict


class PayType(str, Enum):
    HOURLY = "HOURLY"
    MONTHLY = "MONTHLY"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    id: int
    phone_number: str
    phone_number_ext: str
    email: EmailStr
    is_owner: bool
    is_active: bool
    pay_type: str
    address: str
    payrate: float
    organization_id: int

    @computed_field
    @property
    def is_employee(self) -> bool:
        return not self.is_owner


class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    email: EmailStr
    phone_number: str
    phone_number_ext: str
    address: str
    pay_type: PayType
    payrate: float
    organization_id: int
    is_owner: bool


class UserFormSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr = Field(max_length=50)
    phone_number: str = Field(min_length=10, max_length=10)
    phone_number_ext: str = Field(max_length=5)
    address: str = Field(max_length=255)
    pay_type: PayType
    payrate: float
    organization_id: Optional[int] = None


class UserCreateSchema(UserFormSchema):
    password: str


class EditUserSchema(UserFormSchema):
    password: Optional[str]
    id: int


class UserActivationRequest(BaseModel):
    is_active: bool


class DayAvailability(BaseModel):
    available: bool
    start_time: Optional[str] = None
    end_time: Optional[str] = None


class AvailabilityCreateUpdate(BaseModel):
    monday: DayAvailability
    tuesday: DayAvailability
    wednesday: DayAvailability
    thursday: DayAvailability
    friday: DayAvailability
    saturday: DayAvailability
    sunday: DayAvailability
    notes: Optional[str] = None


class AvailabilityResponse(BaseModel):
    id: int
    user_id: int
    organization_id: int
    availability: Dict[str, DayAvailability]
    notes: Optional[str] = None


class EmployeeAvailabilityResponse(BaseModel):
    user_id: int
    user_name: str
    availability: dict  # Same structure as AvailabilityResponse.availability
    notes: str | None


class OrganizationAvailabilityResponse(BaseModel):
    employees: List[EmployeeAvailabilityResponse]


class AvailableEmployeeResponse(BaseModel):
    user_id: int
    user_name: str
    is_available: bool
    is_scheduled: bool
    available_start: Optional[str] = None
    available_end: Optional[str] = None


class AvailableEmployeesResponse(BaseModel):
    date: str
    day_of_week: str
    employees: List[AvailableEmployeeResponse]
