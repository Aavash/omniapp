from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Define overtime threshold locally since it's not in constants
OVERTIME_THRESHOLD_HOURS = 8
from app.models.shift import EmployeePunch
from app.exceptions import CustomHTTPException


def punch_in_employee(db: Session, employee_id: int, organization_id: int):
    """
    Service function to handle employee punch-in logic.
    """
    try:
        # Get the current date and time
        now = datetime.now()
        punch_in_time = now.strftime("%H:%M")
        date = now.strftime("%Y-%m-%d")

        # Check if the employee is already punched in for the day
        existing_punch = (
            db.query(EmployeePunch)
            .filter(
                EmployeePunch.employee_id == employee_id,
                EmployeePunch.date == date,
                EmployeePunch.punch_out_time
                == "00:00",  # Assuming "00:00" means not punched out
            )
            .first()
        )

        if existing_punch:
            raise CustomHTTPException(
                status_code=400, detail="You are already punched in for today."
            )

        # Create a new EmployeePunch record
        new_punch = EmployeePunch(
            employee_id=employee_id,
            organization_id=organization_id,
            date=date,
            punch_in_time=punch_in_time,
            punch_out_time="00:00",  # Default value, will be updated on punch-out
            shift_id=None,  # You can modify this to include shift_id if needed
            remarks="Punched in",
        )

        db.add(new_punch)
        db.commit()
        db.refresh(new_punch)

        return {"message": "Punched in successfully", "punch_in_time": punch_in_time}

    except Exception as e:
        db.rollback()
        raise CustomHTTPException(status_code=500, detail=str(e))


def punch_out_employee(db: Session, employee_id: int):
    """
    Service function to handle employee punch-out logic.
    """
    try:
        # Get the current date and time
        now = datetime.now()
        punch_out_time = now.strftime("%H:%M")
        date = now.strftime("%Y-%m-%d")

        # Find the latest punch-in record for the day
        latest_punch = (
            db.query(EmployeePunch)
            .filter(
                EmployeePunch.employee_id == employee_id,
                EmployeePunch.date == date,
                EmployeePunch.punch_out_time
                == "00:00",  # Assuming "00:00" means not punched out
            )
            .first()
        )

        if not latest_punch:
            raise CustomHTTPException(
                status_code=400, detail="You are not punched in for today."
            )

        # Update the punch-out time
        latest_punch.punch_out_time = punch_out_time

        # Calculate total worked hours
        punch_in = datetime.strptime(latest_punch.punch_in_time, "%H:%M")
        punch_out = datetime.strptime(punch_out_time, "%H:%M")
        total_worked_hours = round((punch_out - punch_in).total_seconds() / 3600, 2)

        # Calculate overtime hours
        if total_worked_hours > OVERTIME_THRESHOLD_HOURS:
            overtime_hours = total_worked_hours - OVERTIME_THRESHOLD_HOURS
        else:
            overtime_hours = 0.0

        # Update the overtime_hours field
        latest_punch.overtime_hours = overtime_hours

        # Commit changes to the database
        db.commit()

        return {
            "message": "Punched out successfully",
            "punch_out_time": punch_out_time,
            "total_worked_hours": total_worked_hours,
            "overtime_hours": overtime_hours,
        }

    except Exception as e:
        db.rollback()
        raise CustomHTTPException(status_code=500, detail=str(e))


def get_punch_status(db: Session, employee_id: int):
    """
    Service function to fetch the punch status for the current day.
    """
    try:
        # Get the current date
        today = datetime.now().strftime("%Y-%m-%d")

        # Find the latest punch record for the day
        latest_punch = (
            db.query(EmployeePunch)
            .filter(
                EmployeePunch.employee_id == employee_id,
                EmployeePunch.date == today,
            )
            .first()
        )

        if not latest_punch:
            return {
                "isClockedIn": False,
                "punchInTime": None,
                "punchOutTime": None,
                "totalWorkedHours": None,
            }

        # Calculate total worked hours if punched out
        total_worked_hours = None
        if latest_punch.punch_out_time != "00:00":
            punch_in = datetime.strptime(latest_punch.punch_in_time, "%H:%M")
            punch_out = datetime.strptime(latest_punch.punch_out_time, "%H:%M")
            total_worked_hours = (punch_out - punch_in).total_seconds() / 3600

        return {
            "isClockedIn": latest_punch.punch_out_time == "00:00",
            "punchInTime": latest_punch.punch_in_time,
            "punchOutTime": latest_punch.punch_out_time
            if latest_punch.punch_out_time != "00:00"
            else None,
            "totalWorkedHours": total_worked_hours,
        }

    except Exception as e:
        raise CustomHTTPException(status_code=500, detail=str(e))
