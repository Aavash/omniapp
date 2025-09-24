"""
Tests for biweekly payment calculation service.
"""

import pytest
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.apis.services.biweekly_payment_calculation import calculate_biweekly_payslip
from app.models.user import User, PayType
from app.models.weeklyhours import WeeklyHours
from app.models.organization import Organization


class TestBiweeklyPaymentCalculation:
    """Test biweekly payment calculation functionality."""

    def test_calculate_biweekly_payslip_no_data(
        self, db_session: Session, test_organization
    ):
        """Test payslip calculation with no weekly hours data."""
        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert result == []

    def test_calculate_biweekly_payslip_single_employee(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation for single employee."""
        # Create employee
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Test Employee",
        )

        # Create weekly hours records
        week1 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 1),
            week_end=date(2024, 1, 7),
            scheduled_hours=40.0,
            worked_hours=40.0,
            overtime_hours=0.0,
        )

        week2 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 8),
            week_end=date(2024, 1, 14),
            scheduled_hours=40.0,
            worked_hours=45.0,
            overtime_hours=5.0,
        )

        db_session.add_all([week1, week2])
        db_session.commit()

        # Calculate payslip
        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result) == 1
        payslip = result[0]

        assert payslip["employee_id"] == employee.id
        assert payslip["employee_name"] == "Test Employee"
        assert payslip["organization_id"] == test_organization.id
        assert payslip["total_scheduled_hours"] == 80.0
        assert payslip["total_worked_hours"] == 85.0
        assert payslip["total_overtime_hours"] == 5.0
        assert payslip["pay_type"] == "HOURLY"
        assert payslip["hourly_rate"] == 25.0
        assert payslip["regular_pay"] > 0
        assert payslip["overtime_pay"] > 0
        assert payslip["gross_income"] > 0
        assert payslip["net_pay"] > 0
        assert payslip["net_pay"] < payslip["gross_income"]

    def test_calculate_biweekly_payslip_multiple_employees(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation for multiple employees."""
        # Create employees
        employee1 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Employee One",
            email="employee1@example.com",
        )

        employee2 = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.MONTHLY,
            payrate=30.0,
            full_name="Employee Two",
            email="employee2@example.com",
        )

        # Create weekly hours for both employees
        for employee in [employee1, employee2]:
            week1 = WeeklyHours(
                employee_id=employee.id,
                organization_id=test_organization.id,
                week_start=date(2024, 1, 1),
                week_end=date(2024, 1, 7),
                scheduled_hours=40.0,
                worked_hours=40.0,
                overtime_hours=0.0,
            )
            db_session.add(week1)

        db_session.commit()

        # Calculate payslips
        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result) == 2

        # Both should be treated as hourly
        for payslip in result:
            assert payslip["pay_type"] == "HOURLY"
            assert payslip["gross_income"] > 0
            assert payslip["net_pay"] > 0

    def test_calculate_biweekly_payslip_with_overtime(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation with overtime hours."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Overtime Employee",
        )

        # Create weekly hours with overtime
        week1 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 1),
            week_end=date(2024, 1, 7),
            scheduled_hours=40.0,
            worked_hours=50.0,
            overtime_hours=10.0,
        )

        db_session.add(week1)
        db_session.commit()

        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result) == 1
        payslip = result[0]

        # Check overtime calculation (1.5x rate)
        expected_regular_pay = 40.0 * 20.0  # 40 hours * $20
        expected_overtime_pay = 10.0 * 20.0 * 1.5  # 10 hours * $20 * 1.5

        assert payslip["regular_pay"] == expected_regular_pay
        assert payslip["overtime_pay"] == expected_overtime_pay
        assert payslip["gross_income"] == expected_regular_pay + expected_overtime_pay

    def test_calculate_biweekly_payslip_different_provinces(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation with different provinces."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Provincial Employee",
        )

        week1 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 1),
            week_end=date(2024, 1, 7),
            scheduled_hours=40.0,
            worked_hours=40.0,
            overtime_hours=0.0,
        )

        db_session.add(week1)
        db_session.commit()

        # Test with Ontario (default)
        result_on = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result_on) == 1
        assert result_on[0]["provincial_tax"] >= 0

    def test_calculate_biweekly_payslip_organization_isolation(
        self, db_session: Session, organization_factory, user_factory
    ):
        """Test that payslip calculation respects organization boundaries."""
        org1 = organization_factory(name="Organization 1")
        org2 = organization_factory(name="Organization 2")

        # Create employee in org1
        employee1 = user_factory(
            organization_id=org1.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Org1 Employee",
            email="org1employee@example.com",
        )

        # Create employee in org2
        employee2 = user_factory(
            organization_id=org2.id,
            pay_type=PayType.HOURLY,
            payrate=25.0,
            full_name="Org2 Employee",
            email="org2employee@example.com",
        )

        # Create weekly hours for both
        for employee in [employee1, employee2]:
            week1 = WeeklyHours(
                employee_id=employee.id,
                organization_id=employee.organization_id,
                week_start=date(2024, 1, 1),
                week_end=date(2024, 1, 7),
                scheduled_hours=40.0,
                worked_hours=40.0,
                overtime_hours=0.0,
            )
            db_session.add(week1)

        db_session.commit()

        # Calculate payslips for org1 only
        result_org1 = calculate_biweekly_payslip(
            db_session, org1.id, "2024-01-01", "2024-01-14", "ON"
        )

        # Should only return employee from org1
        assert len(result_org1) == 1
        assert result_org1[0]["employee_id"] == employee1.id
        assert result_org1[0]["organization_id"] == org1.id

    def test_calculate_biweekly_payslip_zero_hours(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation with zero hours."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Zero Hours Employee",
        )

        # Create weekly hours with zero values
        week1 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 1),
            week_end=date(2024, 1, 7),
            scheduled_hours=0.0,
            worked_hours=0.0,
            overtime_hours=0.0,
        )

        db_session.add(week1)
        db_session.commit()

        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result) == 1
        payslip = result[0]

        assert payslip["total_worked_hours"] == 0.0
        assert payslip["regular_pay"] == 0.0
        assert payslip["overtime_pay"] == 0.0
        assert payslip["gross_income"] == 0.0

    def test_calculate_biweekly_payslip_partial_period(
        self, db_session: Session, test_organization, user_factory
    ):
        """Test payslip calculation with partial period overlap."""
        employee = user_factory(
            organization_id=test_organization.id,
            pay_type=PayType.HOURLY,
            payrate=20.0,
            full_name="Partial Period Employee",
        )

        # Create weekly hours that partially overlap with period
        week1 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2023, 12, 25),  # Before period
            week_end=date(2024, 1, 1),  # Overlaps start
            scheduled_hours=40.0,
            worked_hours=40.0,
            overtime_hours=0.0,
        )

        week2 = WeeklyHours(
            employee_id=employee.id,
            organization_id=test_organization.id,
            week_start=date(2024, 1, 8),
            week_end=date(2024, 1, 20),  # Overlaps end
            scheduled_hours=40.0,
            worked_hours=40.0,
            overtime_hours=0.0,
        )

        db_session.add_all([week1, week2])
        db_session.commit()

        result = calculate_biweekly_payslip(
            db_session, test_organization.id, "2024-01-01", "2024-01-14", "ON"
        )

        assert len(result) == 1
        # Should include both overlapping weeks
        assert result[0]["total_worked_hours"] == 80.0
