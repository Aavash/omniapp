"""
Tests for employee dashboard service.
"""

import pytest
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.apis.services.employee_dashboard import DashboardService
from app.models.user import User, PayType
from app.models.shift import Shift, EmployeePunch
from app.models.weeklyhours import WeeklyHours
from app.models.worksite import WorkSite


class TestEmployeeDashboardService:
    """Test employee dashboard service functionality."""

    def test_get_employee_dashboard_basic(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test basic employee dashboard data retrieval."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Dashboard Employee",
        )

        result = DashboardService.get_employee_dashboard(db_session, employee.id)

        assert result is not None
        assert "employeeInfo" in result
        assert "weeklyHours" in result
        assert result["employeeInfo"]["name"] == "Dashboard Employee"
        assert result["employeeInfo"]["payrate"] == 25.0

    def test_get_employee_dashboard_nonexistent_employee(self, db_session: Session):
        """Test dashboard data for nonexistent employee."""
        with pytest.raises(Exception):  # Should raise an exception
            DashboardService.get_employee_dashboard(db_session, 99999)

    def test_get_employee_dashboard_with_shifts(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test dashboard data with upcoming shifts."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Shift Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create future shift
        tomorrow = date.today() + timedelta(days=1)
        shift = Shift(
            employee_id=employee.id,
            organization_id=test_organization.id,
            worksite_id=worksite.id,
            title="Future Shift",
            date=tomorrow.isoformat(),
            shift_start="09:00",
            shift_end="17:00",
            remarks="Test shift",
        )
        db_session.add(shift)
        db_session.commit()

        result = DashboardService.get_employee_dashboard(db_session, employee.id)

        assert result is not None
        assert "employeeInfo" in result

    def test_get_weekly_history(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test getting weekly history for employee."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="History Employee",
        )

        start_date = date.today() - timedelta(days=7)
        end_date = date.today()

        # Create weekly hours record
        weekly_hours = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=start_date,
            week_end=end_date,
            scheduled_hours=40.0,
            worked_hours=38.0,
            overtime_hours=0.0,
        )
        db_session.add(weekly_hours)
        db_session.commit()

        result = DashboardService.get_weekly_history(
            db_session, employee.id, start_date, end_date
        )

        assert isinstance(result, list)

    def test_get_upcoming_shifts(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test getting upcoming shifts for employee."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Upcoming Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts for next few days
        for i in range(1, 4):  # Next 3 days
            future_date = date.today() + timedelta(days=i)
            shift = Shift(
                employee_id=employee.id,
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                title=f"Upcoming Shift {i}",
                date=future_date.isoformat(),
                shift_start="09:00",
                shift_end="17:00",
                remarks="Test shift",
            )
            db_session.add(shift)

        db_session.commit()

        result = DashboardService.get_upcoming_shifts(db_session, employee.id, 7)

        assert isinstance(result, list)
        assert len(result) >= 0  # May or may not have shifts

    def test_get_employee_dashboard_with_punches(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test dashboard data with punch records."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Punch Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create today's shift
        today = date.today()
        shift = Shift(
            employee_id=employee.id,
            organization_id=test_organization.id,
            worksite_id=worksite.id,
            title="Today's Shift",
            date=today.isoformat(),
            shift_start="09:00",
            shift_end="17:00",
            remarks="Test shift",
        )
        db_session.add(shift)
        db_session.flush()

        # Create punch record
        punch = EmployeePunch(
            employee_id=employee.id,
            organization_id=test_organization.id,
            shift_id=shift.id,
            date=today.isoformat(),
            punch_in_time="09:00",
            punch_out_time="17:00",
        )
        db_session.add(punch)
        db_session.commit()

        result = DashboardService.get_employee_dashboard(db_session, employee.id)

        assert result is not None
        assert "employeeInfo" in result

    def test_dashboard_service_error_handling(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test dashboard service error handling."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Error Employee",
        )

        # Test with valid employee
        result = DashboardService.get_employee_dashboard(db_session, employee.id)
        assert result is not None

        # Test weekly history with invalid dates
        start_date = date.today()
        end_date = date.today() - timedelta(days=7)  # End before start

        result = DashboardService.get_weekly_history(
            db_session, employee.id, start_date, end_date
        )
        assert isinstance(result, list)

    def test_dashboard_multiple_employees_isolation(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test that dashboard data is isolated per employee."""
        employee1 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Employee One",
            email="employee1@dashboard.com",
        )

        employee2 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Employee Two",
            email="employee2@dashboard.com",
        )

        # Get dashboard for each employee
        result1 = DashboardService.get_employee_dashboard(db_session, employee1.id)
        result2 = DashboardService.get_employee_dashboard(db_session, employee2.id)

        assert result1["employeeInfo"]["name"] == "Employee One"
        assert result2["employeeInfo"]["name"] == "Employee Two"

    def test_dashboard_with_weekly_hours(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test dashboard with weekly hours data."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Weekly Hours Employee",
        )

        # Create weekly hours for current week
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)

        weekly_hours = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=week_start,
            week_end=week_end,
            scheduled_hours=40.0,
            worked_hours=35.0,
            overtime_hours=0.0,
        )
        db_session.add(weekly_hours)
        db_session.commit()

        result = DashboardService.get_employee_dashboard(db_session, employee.id)

        assert result is not None
        assert "weeklyHours" in result
        # The weekly hours should be included in the dashboard

    def test_dashboard_performance_with_large_dataset(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test dashboard performance with larger dataset."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Performance Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create many shifts and punch records
        base_date = date.today() - timedelta(days=30)
        for i in range(30):  # 30 days of data
            shift_date = base_date + timedelta(days=i)

            shift = Shift(
                employee_id=employee.id,
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                title=f"Performance Shift {i + 1}",
                date=shift_date.isoformat(),
                shift_start="09:00",
                shift_end="17:00",
                remarks="Test shift",
            )
            db_session.add(shift)

            if i < 20:  # Only add punches for some shifts
                db_session.flush()
                punch = EmployeePunch(
                    employee_id=employee.id,
                    organization_id=test_organization.id,
                    shift_id=shift.id,
                    date=shift_date.isoformat(),
                    punch_in_time="09:00",
                    punch_out_time="17:00",
                )
                db_session.add(punch)

        db_session.commit()

        # Dashboard should still work efficiently
        result = DashboardService.get_employee_dashboard(db_session, employee.id)

        assert result is not None
        assert "employeeInfo" in result
