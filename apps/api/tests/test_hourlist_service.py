"""
Tests for hourlist service.
"""

import pytest
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.apis.services.hourlist_service import calculate_employee_hours
from app.models.user import User, PayType
from app.models.shift import Shift, EmployeePunch


class TestHourlistService:
    """Test hourlist service functionality."""

    def test_calculate_employee_hours_no_data(
        self, db_session: Session, test_organization
    ):
        """Test calculating employee hours with no data."""
        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert result == []

    def test_calculate_employee_hours_with_shifts_only(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test calculating employee hours with shifts but no punches."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Shift Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts for the week
        for i in range(5):  # 5 days
            shift_date = date(2024, 1, 1) + timedelta(days=i)
            shift = Shift(
                employee_id=employee.id,
                title=f"Day Shift {i + 1}",
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                date=shift_date.isoformat(),
                shift_start="09:00",
                shift_end="17:00",  # 8 hours
            )
            db_session.add(shift)

        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        employee_data = result[0]

        assert employee_data["employee"]["id"] == employee.id
        assert employee_data["employee"]["name"] == "Shift Employee"
        assert employee_data["scheduled_hours"] == 40.0  # 5 days * 8 hours
        assert employee_data["worked_hours"] == 0.0  # No punches
        assert employee_data["overtime_hours"] == 0.0

    def test_calculate_employee_hours_with_punches(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test calculating employee hours with shifts and punches."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Punch Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts and punches for the week
        for i in range(5):  # 5 days
            shift_date = date(2024, 1, 1) + timedelta(days=i)

            # Create shift
            shift = Shift(
                employee_id=employee.id,
                title="Test Shift with Punches",
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                date=shift_date.isoformat(),
                shift_start="09:00",
                shift_end="17:00",  # 8 hours scheduled
            )
            db_session.add(shift)
            db_session.flush()

            # Create punch (worked 7.5 hours)
            punch = EmployeePunch(
                employee_id=employee.id,
                organization_id=test_organization.id,
                shift_id=shift.id,
                date=shift_date.isoformat(),
                punch_in_time="09:00",
                punch_out_time="16:30",  # 7.5 hours worked
            )
            db_session.add(punch)

        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        employee_data = result[0]

        assert employee_data["employee"]["id"] == employee.id
        assert employee_data["scheduled_hours"] == 40.0  # 5 days * 8 hours
        assert employee_data["worked_hours"] == 37.5  # 5 days * 7.5 hours
        assert employee_data["overtime_hours"] == 0.0  # Under 40 hours

    def test_calculate_employee_hours_with_overtime(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test calculating employee hours with overtime."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Overtime Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts and punches with overtime
        for i in range(5):  # 5 days
            shift_date = date(2024, 1, 1) + timedelta(days=i)

            # Create shift
            shift = Shift(
                employee_id=employee.id,
                title="Overtime Shift",
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                date=shift_date.isoformat(),
                shift_start="08:00",
                shift_end="18:00",  # 10 hours scheduled
            )
            db_session.add(shift)
            db_session.flush()

            # Create punch (worked 9 hours)
            punch = EmployeePunch(
                employee_id=employee.id,
                organization_id=test_organization.id,
                shift_id=shift.id,
                date=shift_date.isoformat(),
                punch_in_time="08:00",
                punch_out_time="17:00",  # 9 hours worked
            )
            db_session.add(punch)

        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        employee_data = result[0]

        assert employee_data["employee"]["id"] == employee.id
        assert employee_data["scheduled_hours"] == 50.0  # 5 days * 10 hours
        assert employee_data["worked_hours"] == 45.0  # 5 days * 9 hours
        assert employee_data["overtime_hours"] == 5.0  # 45 - 40 = 5 hours overtime

    def test_calculate_employee_hours_multiple_employees(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test calculating hours for multiple employees."""
        employee1 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Employee One",
        )

        employee2 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Employee Two",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts for both employees
        for employee in [employee1, employee2]:
            for i in range(3):  # 3 days each
                shift_date = date(2024, 1, 1) + timedelta(days=i)

                shift = Shift(
                    employee_id=employee.id,
                    title=f"Multi-Employee Shift {i + 1}",
                    organization_id=test_organization.id,
                    worksite_id=worksite.id,
                    date=shift_date.isoformat(),
                    shift_start="09:00",
                    shift_end="17:00",  # 8 hours
                )
                db_session.add(shift)

        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 2

        # Check both employees are included
        employee_ids = [emp["employee"]["id"] for emp in result]
        assert employee1.id in employee_ids
        assert employee2.id in employee_ids

        # Each should have 24 scheduled hours (3 days * 8 hours)
        for emp_data in result:
            assert emp_data["scheduled_hours"] == 24.0

    def test_calculate_employee_hours_organization_isolation(
        self, db_session: Session, organization_factory, user_factory, worksite_factory
    ):
        """Test that hour calculation respects organization boundaries."""
        org1 = organization_factory(name="Organization 1")
        org2 = organization_factory(name="Organization 2")

        employee1 = user_factory(
            organization_id=org1.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Org1 Employee",
        )

        employee2 = user_factory(
            organization_id=org2.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Org2 Employee",
        )

        worksite1 = worksite_factory(organization_id=org1.id)
        worksite2 = worksite_factory(organization_id=org2.id)

        # Create shifts for both employees
        for employee, worksite in [(employee1, worksite1), (employee2, worksite2)]:
            shift = Shift(
                employee_id=employee.id,
                title="Organization Isolation Shift",
                organization_id=employee.organization_id,
                worksite_id=worksite.id,
                date="2024-01-01",
                shift_start="09:00",
                shift_end="17:00",
            )
            db_session.add(shift)

        db_session.commit()

        # Calculate hours for org1 only
        result_org1 = calculate_employee_hours(
            db_session, org1.id, "2024-01-01", "2024-01-07"
        )

        # Should only return employee from org1
        assert len(result_org1) == 1
        assert result_org1[0]["employee"]["id"] == employee1.id

    def test_calculate_employee_hours_date_range_filtering(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test that hour calculation respects date range."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Date Range Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create shifts on different dates
        dates = [
            "2023-12-31",  # Before range
            "2024-01-01",  # In range
            "2024-01-02",  # In range
            "2024-01-08",  # After range
        ]

        for shift_date in dates:
            shift = Shift(
                employee_id=employee.id,
                title=f"Date Range Shift {shift_date}",
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                date=shift_date,
                shift_start="09:00",
                shift_end="17:00",  # 8 hours
            )
            db_session.add(shift)

        db_session.commit()

        # Calculate hours for specific range
        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        # Should only include 2 shifts (Jan 1 and Jan 2)
        assert result[0]["scheduled_hours"] == 16.0  # 2 days * 8 hours

    def test_calculate_employee_hours_partial_punches(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test calculating hours with some shifts having punches and others not."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Partial Punch Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Create 3 shifts, but only punch for 2 of them
        for i in range(3):
            shift_date = date(2024, 1, 1) + timedelta(days=i)

            shift = Shift(
                employee_id=employee.id,
                title=f"Partial Punch Shift {i + 1}",
                organization_id=test_organization.id,
                worksite_id=worksite.id,
                date=shift_date.isoformat(),
                shift_start="09:00",
                shift_end="17:00",  # 8 hours
            )
            db_session.add(shift)
            db_session.flush()

            # Only create punch for first 2 shifts
            if i < 2:
                punch = EmployeePunch(
                    employee_id=employee.id,
                    organization_id=test_organization.id,
                    shift_id=shift.id,
                    date=shift_date.isoformat(),
                    punch_in_time="09:00",
                    punch_out_time="17:00",  # 8 hours worked
                )
                db_session.add(punch)

        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        employee_data = result[0]

        assert employee_data["scheduled_hours"] == 24.0  # 3 days * 8 hours
        assert (
            employee_data["worked_hours"] == 16.0
        )  # 2 days * 8 hours (only punched shifts)
        assert employee_data["overtime_hours"] == 0.0

    def test_calculate_employee_hours_edge_cases(
        self, db_session: Session, test_organization, user_factory, worksite_factory
    ):
        """Test edge cases in hour calculation."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Edge Case Employee",
        )

        worksite = worksite_factory(organization_id=test_organization.id)

        # Test with zero-hour shift
        shift = Shift(
            employee_id=employee.id,
            title="Zero Hour Edge Case Shift",
            organization_id=test_organization.id,
            worksite_id=worksite.id,
            date="2024-01-01",
            shift_start="09:00",
            shift_end="09:00",  # 0 hours
        )
        db_session.add(shift)
        db_session.commit()

        result = calculate_employee_hours(
            db_session, test_organization.id, "2024-01-01", "2024-01-07"
        )

        assert len(result) == 1
        assert result[0]["scheduled_hours"] == 0.0
