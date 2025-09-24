"""Tests for database models."""

import pytest
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.user import User, PayType, Availability
from app.models.organization import Organization
from app.models.worksite import WorkSite
from app.models.shift import (
    Shift,
    ShiftPreset,
    ShiftPresetGroup,
    EmployeePunch,
    Payslip,
)
from app.models.weeklyhours import WeeklyHours
from app.models.subscription import SubscriptionPlan, OrganizationSubscriptionSettings
from app.utils.password import get_password_hash


class TestUserModel:
    """Test User model functionality."""

    def test_user_creation(self, db_session: Session, test_organization):
        """Test creating a user with all required fields."""
        user = User(
            full_name="Test User",
            email="test@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Test St",
            password_hash=get_password_hash("password123"),
            pay_type=PayType.HOURLY,
            payrate=15.50,
            organization_id=test_organization.id,
            is_owner=False,
            is_active=True,
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.full_name == "Test User"
        assert user.email == "test@example.com"
        assert user.pay_type == PayType.HOURLY
        assert user.payrate == 15.50
        assert user.is_active is True

    def test_user_unique_email_constraint(self, db_session: Session, test_organization):
        """Test that email must be unique."""
        user1 = User(
            full_name="User One",
            email="duplicate@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Test St",
            password_hash=get_password_hash("password123"),
            pay_type=PayType.HOURLY,
            payrate=15.00,
            organization_id=test_organization.id,
        )

        user2 = User(
            full_name="User Two",
            email="duplicate@example.com",
            phone_number="0987654321",
            phone_number_ext="456",
            address="456 Test Ave",
            password_hash=get_password_hash("password456"),
            pay_type=PayType.MONTHLY,
            payrate=3000.00,
            organization_id=test_organization.id,
        )

        db_session.add(user1)
        db_session.commit()

        db_session.add(user2)
        with pytest.raises(IntegrityError):
            db_session.commit()

    def test_pay_type_enum(self, db_session: Session, test_organization):
        """Test PayType enum values."""
        hourly_user = User(
            full_name="Hourly User",
            email="hourly@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Test St",
            password_hash=get_password_hash("password123"),
            pay_type=PayType.HOURLY,
            payrate=20.00,
            organization_id=test_organization.id,
        )

        monthly_user = User(
            full_name="Monthly User",
            email="monthly@example.com",
            phone_number="0987654321",
            phone_number_ext="456",
            address="456 Test Ave",
            password_hash=get_password_hash("password456"),
            pay_type=PayType.MONTHLY,
            payrate=4000.00,
            organization_id=test_organization.id,
        )

        db_session.add_all([hourly_user, monthly_user])
        db_session.commit()

        assert hourly_user.pay_type == PayType.HOURLY
        assert monthly_user.pay_type == PayType.MONTHLY


class TestAvailabilityModel:
    """Test Availability model functionality."""

    def test_availability_creation(self, db_session: Session, test_user):
        """Test creating availability record."""
        from datetime import time

        availability = Availability(
            user_id=test_user.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
            tuesday_available=False,
            notes="Available most days",
        )

        db_session.add(availability)
        db_session.commit()
        db_session.refresh(availability)

        assert availability.id is not None
        assert availability.user_id == test_user.id
        assert availability.monday_available is True
        assert availability.tuesday_available is False
        assert availability.notes == "Available most days"


class TestShiftModel:
    """Test Shift model functionality."""

    def test_shift_creation(self, db_session: Session, test_user, test_worksite):
        """Test creating a shift."""
        shift = Shift(
            employee_id=test_user.id,
            title="Morning Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Regular shift",
            called_in=False,
        )

        db_session.add(shift)
        db_session.commit()
        db_session.refresh(shift)

        assert shift.id is not None
        assert shift.title == "Morning Shift"
        assert shift.date == "2024-01-15"
        assert shift.shift_start == "09:00"
        assert shift.shift_end == "17:00"
        assert shift.called_in is False

    def test_shift_preset_group_creation(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test creating a shift preset group."""
        preset_group = ShiftPresetGroup(
            title="Standard Shifts",
            worksite_id=test_worksite.id,
            organization_id=test_organization.id,
        )

        db_session.add(preset_group)
        db_session.commit()
        db_session.refresh(preset_group)

        assert preset_group.id is not None
        assert preset_group.title == "Standard Shifts"

    def test_shift_preset_creation(
        self, db_session: Session, test_user, test_organization
    ):
        """Test creating a shift preset."""
        # First create a preset group
        preset_group = ShiftPresetGroup(
            title="Test Group",
            worksite_id=1,  # Assuming worksite exists
            organization_id=test_organization.id,
        )
        db_session.add(preset_group)
        db_session.commit()

        preset = ShiftPreset(
            employee_id=test_user.id,
            preset_group_id=preset_group.id,
            title="Monday Morning",
            organization_id=test_organization.id,
            day_of_week=1,  # Monday
            shift_start="09:00",
            shift_end="17:00",
            remarks="Standard Monday shift",
        )

        db_session.add(preset)
        db_session.commit()
        db_session.refresh(preset)

        assert preset.id is not None
        assert preset.day_of_week == 1
        assert preset.shift_start == "09:00"
        assert preset.shift_end == "17:00"


class TestEmployeePunchModel:
    """Test EmployeePunch model functionality."""

    def test_employee_punch_creation(self, db_session: Session, test_user):
        """Test creating an employee punch record."""
        punch = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-15",
            punch_in_time="09:00",
            punch_out_time="17:00",
            overtime_hours=1.5,
            remarks="Worked overtime",
        )

        db_session.add(punch)
        db_session.commit()
        db_session.refresh(punch)

        assert punch.id is not None
        assert punch.date == "2024-01-15"
        assert punch.overtime_hours == 1.5
        assert punch.remarks == "Worked overtime"


class TestWeeklyHoursModel:
    """Test WeeklyHours model functionality."""

    def test_weekly_hours_creation(self, db_session: Session, test_user):
        """Test creating a weekly hours record."""
        weekly_hours = WeeklyHours(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            week_start=date(2024, 1, 15),
            week_end=date(2024, 1, 21),
            scheduled_hours=40.0,
            worked_hours=42.0,
            overtime_hours=2.0,
        )

        db_session.add(weekly_hours)
        db_session.commit()
        db_session.refresh(weekly_hours)

        assert weekly_hours.id is not None
        assert weekly_hours.scheduled_hours == 40.0
        assert weekly_hours.worked_hours == 42.0
        assert weekly_hours.overtime_hours == 2.0


class TestSubscriptionModels:
    """Test subscription-related models."""

    def test_subscription_plan_creation(self, db_session: Session):
        """Test creating a subscription plan."""
        plan = SubscriptionPlan(
            name="Basic Plan",
            price=29.99,
            features="Basic features included",
            is_active=True,
        )

        db_session.add(plan)
        db_session.commit()
        db_session.refresh(plan)

        assert plan.id is not None
        assert plan.name == "Basic Plan"
        assert plan.price == 29.99
        assert plan.is_active is True

    def test_organization_subscription_settings(
        self, db_session: Session, test_organization
    ):
        """Test creating organization subscription settings."""
        # First create a subscription plan
        plan = SubscriptionPlan(
            name="Test Plan",
            price=49.99,
            features="Test features",
            is_active=True,
        )
        db_session.add(plan)
        db_session.commit()

        settings = OrganizationSubscriptionSettings(
            organization_id=test_organization.id,
            plan_id=plan.id,
            activate_manually=False,
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 12, 31),
            is_active=True,
        )

        db_session.add(settings)
        db_session.commit()
        db_session.refresh(settings)

        assert settings.id is not None
        assert settings.organization_id == test_organization.id
        assert settings.activate_manually is False
        assert settings.is_active is True


class TestPayslipModel:
    """Test Payslip model functionality."""

    def test_payslip_creation(self, db_session: Session, test_user):
        """Test creating a payslip."""
        payslip = Payslip(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            period_start="2024-01-01",
            period_end="2024-01-15",
            total_hours=80.0,
            overtime_hours=5.0,
            base_salary=1200.00,
            overtime_pay=150.00,
            deductions=100.00,
            net_pay=1250.00,
            remarks="Bi-weekly payslip",
        )

        db_session.add(payslip)
        db_session.commit()
        db_session.refresh(payslip)

        assert payslip.id is not None
        assert payslip.total_hours == 80.0
        assert payslip.net_pay == 1250.00
        assert payslip.remarks == "Bi-weekly payslip"
