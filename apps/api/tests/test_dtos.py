"""Tests for Data Transfer Objects (DTOs)."""

import pytest
from pydantic import ValidationError

from app.apis.dtos.auth import LoginUser, ContactEmail
from app.apis.dtos.user import (
    UserCreateSchema,
    EditUserSchema,
    UserResponse,
    DayAvailability,
    AvailabilityCreateUpdate,
    PayType,
)
from app.apis.dtos.worksite import (
    WorkSiteCreateSchema,
    WorkSiteEditSchema,
    WorkSiteResponse,
    Status,
)
from app.apis.dtos.shift import (
    ShiftCreateSchema,
    ShiftEditSchema,
    ShiftResponse,
)


class TestAuthDTOs:
    """Test authentication-related DTOs."""

    def test_login_user_valid(self):
        """Test valid login user creation."""
        login_data = {"email": "user@example.com", "password": "password123"}

        login_user = LoginUser(**login_data)

        assert login_user.email == "user@example.com"
        assert login_user.password == "password123"

    def test_login_user_invalid_email(self):
        """Test login user with invalid email."""
        login_data = {"email": "invalid-email", "password": "password123"}

        with pytest.raises(ValidationError) as exc_info:
            LoginUser(**login_data)

        assert "email" in str(exc_info.value).lower()

    def test_contact_email_valid(self):
        """Test valid contact email creation."""
        contact_data = {
            "email": "contact@example.com",
            "name": "John Doe",
            "message": "This is a test message",
        }

        contact_email = ContactEmail(**contact_data)

        assert contact_email.email == "contact@example.com"
        assert contact_email.name == "John Doe"
        assert contact_email.message == "This is a test message"


class TestUserDTOs:
    """Test user-related DTOs."""

    def test_user_create_schema_valid(self):
        """Test valid user creation schema."""
        user_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 Main St",
            "password": "password123",
            "pay_type": PayType.HOURLY,
            "payrate": 15.50,
        }

        user_schema = UserCreateSchema(**user_data)

        assert user_schema.full_name == "John Doe"
        assert user_schema.email == "john@example.com"
        assert user_schema.pay_type == PayType.HOURLY
        assert user_schema.payrate == 15.50

    def test_pay_type_enum_values(self):
        """Test PayType enum values."""
        assert PayType.HOURLY == "HOURLY"
        assert PayType.MONTHLY == "MONTHLY"

    def test_day_availability_valid(self):
        """Test valid day availability creation."""
        day_data = {"available": True, "start_time": "09:00", "end_time": "17:00"}

        day_availability = DayAvailability(**day_data)

        assert day_availability.available is True
        assert day_availability.start_time == "09:00"
        assert day_availability.end_time == "17:00"

    def test_day_availability_not_available(self):
        """Test day availability when not available."""
        day_data = {"available": False, "start_time": None, "end_time": None}

        day_availability = DayAvailability(**day_data)

        assert day_availability.available is False
        assert day_availability.start_time is None
        assert day_availability.end_time is None


class TestWorksiteDTOs:
    """Test worksite-related DTOs."""

    def test_worksite_create_schema_valid(self):
        """Test valid worksite creation schema."""
        worksite_data = {
            "name": "Main Office",
            "address": "456 Office Blvd",
            "city": "Business City",
            "state": "CA",
            "zip_code": "12345",
            "contact_person": "Jane Manager",
            "contact_phone": "555-0456",
            "status": Status.ACTIVE,
        }

        worksite_schema = WorkSiteCreateSchema(**worksite_data)

        assert worksite_schema.name == "Main Office"
        assert worksite_schema.address == "456 Office Blvd"
        assert worksite_schema.status == Status.ACTIVE

    def test_worksite_status_enum(self):
        """Test worksite status enum values."""
        assert Status.ACTIVE == "Active"
        assert Status.INACTIVE == "Inactive"

    def test_worksite_edit_schema_partial(self):
        """Test worksite edit with partial data."""
        edit_data = {"id": 1, "name": "Updated Office Name"}

        worksite_edit = WorkSiteEditSchema(**edit_data)

        assert worksite_edit.id == 1
        assert worksite_edit.name == "Updated Office Name"


class TestShiftDTOs:
    """Test shift-related DTOs."""

    def test_shift_create_schema_valid(self):
        """Test valid shift creation schema."""
        shift_data = {
            "employee_id": 1,
            "title": "Morning Shift",
            "worksite_id": 1,
            "date": "2024-01-15",
            "shift_start": "09:00",
            "shift_end": "17:00",
            "remarks": "Regular shift",
        }

        shift_schema = ShiftCreateSchema(**shift_data)

        assert shift_schema.employee_id == 1
        assert shift_schema.title == "Morning Shift"
        assert shift_schema.date == "2024-01-15"
        assert shift_schema.shift_start == "09:00"
        assert shift_schema.shift_end == "17:00"

    def test_shift_create_schema_invalid_date_format(self):
        """Test shift creation with invalid date format."""
        shift_data = {
            "employee_id": 1,
            "title": "Morning Shift",
            "worksite_id": 1,
            "date": "invalid-date",
            "shift_start": "09:00",
            "shift_end": "17:00",
            "remarks": "Regular shift",
        }

        with pytest.raises(ValidationError) as exc_info:
            ShiftCreateSchema(**shift_data)

        assert "date" in str(exc_info.value).lower()

    def test_shift_create_schema_invalid_time_format(self):
        """Test shift creation with invalid time format."""
        shift_data = {
            "employee_id": 1,
            "title": "Morning Shift",
            "worksite_id": 1,
            "date": "2024-01-15",
            "shift_start": "invalid-time",
            "shift_end": "17:00",
            "remarks": "Regular shift",
        }

        with pytest.raises(ValidationError) as exc_info:
            ShiftCreateSchema(**shift_data)

        assert "time" in str(exc_info.value).lower()

    def test_shift_edit_schema_valid(self):
        """Test valid shift edit schema."""
        edit_data = {
            "worksite_id": 2,
            "employee_id": 1,
            "date": "2024-01-16",
            "shift_start": "10:00",
            "shift_end": "18:00",
            "remarks": "Updated shift",
        }

        shift_edit = ShiftEditSchema(**edit_data)

        assert shift_edit.date == "2024-01-16"
        assert shift_edit.shift_start == "10:00"
        assert shift_edit.shift_end == "18:00"


class TestDTOValidation:
    """Test general DTO validation behavior."""

    def test_required_fields_validation(self):
        """Test that required fields are properly validated."""
        # Test missing required field in LoginUser
        with pytest.raises(ValidationError):
            LoginUser(email="user@example.com")  # Missing password

    def test_email_validation(self):
        """Test email field validation."""
        # Test invalid email format
        with pytest.raises(ValidationError):
            LoginUser(email="invalid-email", password="password123")

    def test_enum_validation(self):
        """Test enum field validation."""
        # Test invalid PayType
        user_data = {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 Main St",
            "password": "password123",
            "pay_type": "INVALID_TYPE",
            "payrate": 15.50,
        }

        with pytest.raises(ValidationError):
            UserCreateSchema(**user_data)
