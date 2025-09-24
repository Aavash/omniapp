from enum import Enum
from pydantic import BaseModel, ConfigDict
from typing import Optional


class Status(str, Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class WorkSiteCreateSchema(BaseModel):
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    contact_person: str
    contact_phone: str
    status: Status


class WorkSiteEditSchema(BaseModel):
    id: int
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    status: Optional[str] = None


class WorkSiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    city: str
    state: str
    zip_code: str
    contact_person: str
    contact_phone: str
    status: str
    organization_id: int
