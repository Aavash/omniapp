"""Tests for availability service functions."""

import pytest
from datetime import date, time
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.apis.services.availability import (
    get_time_or_none,
    create_or_update_availability,
    get_availability,
    delete_availability,
    list_organization_availability,
    list_available_employees,
    format_availability_response,
)
from app.apis.dtos.user import AvailabilityCreateUpdate, DayAvailability
from app.models.user import Availability, User
from app.models.shift import Shift


class TestAvailabilityServices:
    """Test availability service functions."""

    def test_get_time_or_none_valid_time(self):
        """Test converting valid time string to time object."""
        result = get_time_or_none("09:30")
        assert result == time(9, 30)

        result = get_time_or_none("14:45:30")
        assert result == time(14, 45, 30)

    def test_get_time_or_none_empty_string(self):
        """Test converting empty string returns None."""
        result = get_time_or_none("")
        assert result is None

        result = get_time_or_none(None)
        assert result is None

    def test_get_time_or_none_invalid_format(self):
        """Test converting invalid time format raises HTTPException."""
        with pytest.raises(HTTPException) as exc_info:
            get_time_or_none("invalid_time")

        assert exc_info.value.status_code == 400
        assert "Invalid time format" in str(exc_info.value.detail)

    def test_create_availability_new_record(self, db_session: Session, test_user):
        """Test creating new availability record."""
        availability_data = AvailabilityCreateUpdate(
            monday=DayAvailability(
                available=True, start_time="09:00", end_time="17:00"
            ),
            tuesday=DayAvailability(available=False, start_time="", end_time=""),
            wednesday=DayAvailability(
                available=True, start_time="10:00", end_time="18:00"
            ),
            thursday=DayAvailability(
                available=True, start_time="09:00", end_time="17:00"
            ),
            friday=DayAvailability(
                available=True, start_time="09:00", end_time="17:00"
            ),
            saturday=DayAvailability(available=False, start_time="", end_time=""),
            sunday=DayAvailability(available=False, start_time="", end_time=""),
            notes="Available most weekdays",
        )

        result = create_or_update_availability(
            db_session, test_user.id, availability_data, test_user
        )

        assert result.user_id == test_user.id
        assert result.availability["monday"].available is True
        assert result.availability["tuesday"].available is False
        assert result.notes == "Available most weekdays"

    def test_create_availability_user_not_found(self, db_session: Session, test_user):
        """Test creating availability for non-existent user."""
        availability_data = AvailabilityCreateUpdate(
            monday=DayAvailability(
                available=True, start_time="09:00", end_time="17:00"
            ),
            tuesday=DayAvailability(available=False, start_time="", end_time=""),
            wednesday=DayAvailability(available=False, start_time="", end_time=""),
            thursday=DayAvailability(available=False, start_time="", end_time=""),
            friday=DayAvailability(available=False, start_time="", end_time=""),
            saturday=DayAvailability(available=False, start_time="", end_time=""),
            sunday=DayAvailability(available=False, start_time="", end_time=""),
        )

        with pytest.raises(HTTPException) as exc_info:
            create_or_update_availability(db_session, 999, availability_data, test_user)

        assert exc_info.value.status_code == 404
        assert "User not found in organization" in str(exc_info.value.detail)

    def test_update_existing_availability(self, db_session: Session, test_user):
        """Test updating existing availability record."""
        # Create initial availability
        availability = Availability(
            user_id=test_user.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
            notes="Initial availability",
        )
        db_session.add(availability)
        db_session.commit()

        # Update availability
        availability_data = AvailabilityCreateUpdate(
            monday=DayAvailability(
                available=True, start_time="10:00", end_time="18:00"
            ),
            tuesday=DayAvailability(
                available=True, start_time="09:00", end_time="17:00"
            ),
            wednesday=DayAvailability(available=False, start_time="", end_time=""),
            thursday=DayAvailability(available=False, start_time="", end_time=""),
            friday=DayAvailability(available=False, start_time="", end_time=""),
            saturday=DayAvailability(available=False, start_time="", end_time=""),
            sunday=DayAvailability(available=False, start_time="", end_time=""),
            notes="Updated availability",
        )

        result = create_or_update_availability(
            db_session, test_user.id, availability_data, test_user
        )

        assert result.availability["monday"].start_time == "10:00:00"
        assert result.availability["monday"].end_time == "18:00:00"
        assert result.availability["tuesday"].available is True
        assert result.notes == "Updated availability"

    def test_get_availability_success(self, db_session: Session, test_user):
        """Test successfully getting availability."""
        # Create availability
        availability = Availability(
            user_id=test_user.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
            notes="Test availability",
        )
        db_session.add(availability)
        db_session.commit()

        result = get_availability(db_session, test_user.id, test_user.organization_id)

        assert result.user_id == test_user.id
        assert result.availability["monday"].available is True
        assert result.notes == "Test availability"

    def test_get_availability_not_found(self, db_session: Session, test_user):
        """Test getting availability that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            get_availability(db_session, test_user.id, test_user.organization_id)

        assert exc_info.value.status_code == 404
        assert "Availability record not found" in str(exc_info.value.detail)

    def test_delete_availability_success(self, db_session: Session, test_user):
        """Test successfully deleting availability."""
        # Create availability
        availability = Availability(
            user_id=test_user.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
        )
        db_session.add(availability)
        db_session.commit()

        # Delete availability
        delete_availability(db_session, test_user.id, test_user.organization_id)

        # Verify deletion
        deleted_availability = (
            db_session.query(Availability)
            .filter(Availability.user_id == test_user.id)
            .first()
        )
        assert deleted_availability is None

    def test_delete_availability_not_found(self, db_session: Session, test_user):
        """Test deleting availability that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            delete_availability(db_session, test_user.id, test_user.organization_id)

        assert exc_info.value.status_code == 404
        assert "Availability record not found" in str(exc_info.value.detail)

    def test_list_organization_availability(
        self, db_session: Session, test_organization
    ):
        """Test listing organization availability."""
        # Create users with availability
        user1 = User(
            full_name="User One",
            email="user1@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Test St",
            password_hash=b"hashed_password",
            pay_type="HOURLY",
            payrate=15.00,
            organization_id=test_organization.id,
        )
        user2 = User(
            full_name="User Two",
            email="user2@example.com",
            phone_number="0987654321",
            phone_number_ext="456",
            address="456 Test Ave",
            password_hash=b"hashed_password",
            pay_type="HOURLY",
            payrate=16.00,
            organization_id=test_organization.id,
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Create availability for user1
        availability1 = Availability(
            user_id=user1.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
        )
        db_session.add(availability1)
        db_session.commit()

        result = list_organization_availability(db_session, test_organization.id)

        assert len(result.employees) >= 1
        # Find user1 in results
        user1_availability = next(
            (emp for emp in result.employees if emp.user_id == user1.id), None
        )
        assert user1_availability is not None
        assert user1_availability.availability["monday"]["available"] is True

    def test_list_available_employees(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test listing available employees for a specific date."""
        # Create users
        user1 = User(
            full_name="Available User",
            email="available@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Test St",
            password_hash=b"hashed_password",
            pay_type="HOURLY",
            payrate=15.00,
            organization_id=test_organization.id,
        )
        user2 = User(
            full_name="Scheduled User",
            email="scheduled@example.com",
            phone_number="0987654321",
            phone_number_ext="456",
            address="456 Test Ave",
            password_hash=b"hashed_password",
            pay_type="HOURLY",
            payrate=16.00,
            organization_id=test_organization.id,
        )
        db_session.add_all([user1, user2])
        db_session.commit()

        # Create availability for both users (Monday available)
        availability1 = Availability(
            user_id=user1.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
        )
        availability2 = Availability(
            user_id=user2.id,
            monday_available=True,
            monday_start=time(10, 0),
            monday_end=time(18, 0),
        )
        db_session.add_all([availability1, availability2])
        db_session.commit()

        # Schedule user2 for the target date (Monday)
        target_date = date(2024, 1, 15)  # Assuming this is a Monday
        shift = Shift(
            employee_id=user2.id,
            title="Scheduled Shift",
            organization_id=test_organization.id,
            worksite_id=test_worksite.id,
            date=target_date.isoformat(),
            shift_start="10:00",
            shift_end="18:00",
            remarks="Already scheduled",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        result = list_available_employees(db_session, test_organization.id, target_date)

        # Should only return user1 (user2 is already scheduled)
        assert len(result.employees) >= 1
        available_user_ids = [emp.user_id for emp in result.employees]
        assert user1.id in available_user_ids
        assert user2.id not in available_user_ids

    def test_format_availability_response(self, db_session: Session, test_user):
        """Test formatting availability response."""
        availability = Availability(
            user_id=test_user.id,
            monday_available=True,
            monday_start=time(9, 0),
            monday_end=time(17, 0),
            tuesday_available=False,
            notes="Test formatting",
        )
        db_session.add(availability)
        db_session.commit()

        result = format_availability_response(db_session, availability)

        assert result.user_id == test_user.id
        assert result.availability["monday"].available is True
        assert result.availability["monday"].start_time == "09:00:00"
        assert result.availability["tuesday"].available is False
        assert result.notes == "Test formatting"
