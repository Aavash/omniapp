from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models.user import User
from app.utils.jwt import get_current_user
from app.apis.services.employee_punch_service import (
    punch_in_employee,
    punch_out_employee,
    get_punch_status,
)

employee_punch_router = APIRouter(prefix="/employee-user", tags=["employee-user"])

@employee_punch_router.post("/punch-in")
def punch_in(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint for employees to punch in.
    """
    return punch_in_employee(db, current_user.id, current_user.organization_id)

@employee_punch_router.post("/punch-out")
def punch_out(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint for employees to punch out.
    """
    return punch_out_employee(db, current_user.id)

@employee_punch_router.get("/punch-status")
def punch_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint to fetch the punch status for the current day.
    """
    return get_punch_status(db, current_user.id)