from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import Any, Dict, List, Optional
from app.models.user import User
from app.models.shift import EmployeePunch, Shift
from app.models.weeklyhours import WeeklyHours
from app.models.worksite import WorkSite
from app.exceptions import CustomHTTPException
from sqlalchemy import func, and_, or_


class DashboardService:
    @staticmethod
    def get_employee_dashboard(db: Session, employee_id: int) -> Dict[str, Any]:
        """
        Get all dashboard data for an employee
        Args:
            db: SQLAlchemy Session
            employee_id: ID of the employee
        Returns:
            Dictionary containing dashboard data
        """
        try:
            today = date.today()

            return {
                "employeeInfo": DashboardService._get_employee_info(db, employee_id),
                "weeklyHours": DashboardService._get_hours_for_period(
                    db, employee_id, "week", today
                ),
                "monthlyHours": DashboardService._get_hours_for_period(
                    db, employee_id, "month", today
                ),
                "yearlyHours": DashboardService._get_hours_for_period(
                    db, employee_id, "year", today
                ),
                "notifications": DashboardService._generate_notifications(
                    db, employee_id, today
                ),
                "nextShift": DashboardService._get_next_shift(db, employee_id),
            }

        except Exception as e:
            raise CustomHTTPException(
                status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}"
            )

    @staticmethod
    def _get_employee_info(db: Session, employee_id: int) -> Dict[str, Any]:
        employee = db.query(User).filter(User.id == employee_id).first()
        if not employee:
            raise CustomHTTPException(status_code=404, detail="Employee not found")

        return {
            "name": employee.full_name,
            "payrate": employee.payrate,
            "payType": employee.pay_type.value if employee.pay_type else None,
        }

    @staticmethod
    def _get_hours_for_period(
        db: Session, employee_id: int, period: str, reference_date: date
    ) -> Dict[str, float]:
        if period == "week":
            start_date = reference_date - timedelta(days=reference_date.weekday())
            end_date = start_date + timedelta(days=6)
        elif period == "month":
            start_date = reference_date.replace(day=1)
            end_date = reference_date
        else:  # year
            start_date = reference_date.replace(month=1, day=1)
            end_date = reference_date

        # Convert dates to strings in YYYY-MM-DD format
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

        # Get weekly hours records for the period using direct string comparison
        records = (
            db.query(WeeklyHours)
            .filter(
                WeeklyHours.employee_id == employee_id,
                WeeklyHours.week_start >= start_date_str,
                WeeklyHours.week_end <= end_date_str,
                WeeklyHours.is_deleted == False,
            )
            .all()
        )

        return {
            "worked": round(sum(r.worked_hours for r in records), 2),
            "scheduled": round(sum(r.scheduled_hours for r in records), 2),
            "overtime": round(sum(r.overtime_hours for r in records), 2),
        }

    @staticmethod
    def _generate_notifications(
        db: Session, employee_id: int, today: date
    ) -> List[Dict[str, str]]:
        notifications = []
        today_str = today.strftime("%Y-%m-%d")

        # Check for upcoming shifts today
        upcoming_shift = (
            db.query(Shift)
            .filter(
                Shift.employee_id == employee_id,
                Shift.date == today_str,
                Shift.shift_start > datetime.now().strftime("%H:%M"),
            )
            .first()
        )

        if upcoming_shift:
            notifications.append(
                {
                    "message": f"You have a shift today at {upcoming_shift.shift_start}",
                    "type": "reminder",
                }
            )

        # Check for overtime using weekly hours data
        weekly_hours = DashboardService._get_hours_for_period(
            db, employee_id, "week", today
        )
        if weekly_hours["worked"] >= 40:
            notifications.append(
                {
                    "message": "You've reached weekly overtime threshold",
                    "type": "warning",
                }
            )

        # Check for pending punches
        pending_punch = (
            db.query(EmployeePunch)
            .filter(
                EmployeePunch.employee_id == employee_id,
                EmployeePunch.punch_out_time.is_(None),
            )
            .first()
        )

        if pending_punch:
            notifications.append(
                {
                    "message": "You have an open punch that needs to be closed",
                    "type": "alert",
                }
            )

        return notifications

    @staticmethod
    def _get_next_shift(db: Session, employee_id: int) -> Optional[Dict[str, Any]]:
        today_str = date.today().strftime("%Y-%m-%d")
        now_str = datetime.now().strftime("%H:%M")

        # Get next shift today or future
        next_shift = (
            db.query(Shift)
            .filter(
                Shift.employee_id == employee_id,
                or_(
                    and_(Shift.date == today_str, Shift.shift_start > now_str),
                    Shift.date > today_str,
                ),
            )
            .order_by(Shift.date, Shift.shift_start)
            .first()
        )

        if not next_shift:
            return None

        worksite = (
            db.query(WorkSite).filter(WorkSite.id == next_shift.worksite_id).first()
        )

        return {
            "date": next_shift.date,
            "start_time": next_shift.shift_start,
            "end_time": next_shift.shift_end,
            "title": next_shift.title,
            "location": worksite.name if worksite else None,
        }

    @staticmethod
    def get_weekly_history(
        db: Session, employee_id: int, start_date: date, end_date: date
    ) -> List[Dict[str, Any]]:
        try:
            # Convert dates to strings in YYYY-MM-DD format
            start_date_str = start_date.strftime("%Y-%m-%d")
            end_date_str = end_date.strftime("%Y-%m-%d")

            # Get weekly hours records for the date range using direct string comparison
            records = (
                db.query(WeeklyHours)
                .filter(
                    WeeklyHours.employee_id == employee_id,
                    WeeklyHours.week_start >= start_date_str,
                    WeeklyHours.week_end <= end_date_str,
                    WeeklyHours.is_deleted == False,
                )
                .order_by(WeeklyHours.week_start)
                .all()
            )

            return [
                {
                    "week_start": record.week_start,
                    "week_end": record.week_end,
                    "worked_hours": round(record.worked_hours, 2),
                    "scheduled_hours": round(record.scheduled_hours, 2),
                    "overtime_hours": round(record.overtime_hours, 2),
                }
                for record in records
            ]

        except Exception as e:
            raise CustomHTTPException(
                status_code=500, detail=f"Failed to fetch weekly history: {str(e)}"
            )

    @staticmethod
    def get_upcoming_shifts(
        db: Session, employee_id: int, days_ahead: int
    ) -> List[Dict[str, Any]]:
        try:
            today_str = date.today().strftime("%Y-%m-%d")
            end_date = (date.today() + timedelta(days=days_ahead)).strftime("%Y-%m-%d")

            shifts = (
                db.query(Shift)
                .filter(
                    Shift.employee_id == employee_id,
                    Shift.date >= today_str,
                    Shift.date <= end_date,
                )
                .order_by(Shift.date, Shift.shift_start)
                .all()
            )

            return [
                {
                    "id": shift.id,
                    "date": shift.date,
                    "start_time": shift.shift_start,
                    "end_time": shift.shift_end,
                    "called_in": shift.called_in,
                    "called_in_reason": shift.call_in_reason,
                    "title": shift.title,
                    "location": db.query(WorkSite)
                    .filter(WorkSite.id == shift.worksite_id)
                    .first()
                    .name
                    if shift.worksite_id
                    else None,
                    "status": "scheduled",
                }
                for shift in shifts
            ]

        except Exception as e:
            raise CustomHTTPException(
                status_code=500, detail=f"Failed to fetch upcoming shifts: {str(e)}"
            )
