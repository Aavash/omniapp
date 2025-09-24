"""Tests for shift service functions."""

import pytest
from datetime import date
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.apis.services.shift import (
    get_shift_by_id,
    has_overlapping_shift,
    create_shift,
    edit_shift,
    delete_shift,
    list_shifts,
    list_call_ins,
)
from app.apis.dtos.shift import ShiftCreateSchema, ShiftEditSchema
from app.models.shift import Shift
from app.models.user import User
from app.models.worksite import WorkSite


class TestShiftServices:
    """Test shift service functions."""

    def test_get_shift_by_id_success(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test successfully getting a shift by ID."""
        shift = Shift(
            employee_id=test_user.id,
            title="Test Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Test shift",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        result = get_shift_by_id(db_session, shift.id, test_user.organization_id)

        assert result.id == shift.id
        assert result.title == "Test Shift"

    def test_get_shift_by_id_not_found(self, db_session: Session, test_user):
        """Test getting a shift that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            get_shift_by_id(db_session, 999, test_user.organization_id)

        assert exc_info.value.status_code == 404
        assert "Shift not found" in str(exc_info.value.detail)

    def test_has_overlapping_shift_no_overlap(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test checking for overlapping shifts when none exist."""
        shift_data = ShiftCreateSchema(
            employee_id=test_user.id,
            title="New Shift",
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="New shift",
        )

        result = has_overlapping_shift(db_session, shift_data, test_user)
        assert result is None

    def test_has_overlapping_shift_with_overlap(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test checking for overlapping shifts when overlap exists."""
        # Create existing shift
        existing_shift = Shift(
            employee_id=test_user.id,
            title="Existing Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Existing shift",
            called_in=False,
        )
        db_session.add(existing_shift)
        db_session.commit()

        # Try to create overlapping shift
        shift_data = ShiftCreateSchema(
            employee_id=test_user.id,
            title="Overlapping Shift",
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="10:00",  # Overlaps with existing shift
            shift_end="18:00",
            remarks="Overlapping shift",
        )

        result = has_overlapping_shift(db_session, shift_data, test_user)
        assert result is not None
        assert result.id == existing_shift.id

    def test_create_shift_success(self, db_session: Session, test_user, test_worksite):
        """Test successfully creating a shift."""
        shift_data = ShiftCreateSchema(
            employee_id=test_user.id,
            title="New Shift",
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="New shift",
        )

        result = create_shift(db_session, shift_data, test_user)

        assert result.id is not None
        assert result.title == "New Shift"
        assert result.employee_id == test_user.id
        assert result.organization_id == test_user.organization_id
        assert result.called_in is False

    def test_create_shift_with_overlap(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test creating a shift that overlaps with existing shift."""
        # Create existing shift
        existing_shift = Shift(
            employee_id=test_user.id,
            title="Existing Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Existing shift",
            called_in=False,
        )
        db_session.add(existing_shift)
        db_session.commit()

        # Try to create overlapping shift
        shift_data = ShiftCreateSchema(
            employee_id=test_user.id,
            title="Overlapping Shift",
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Overlapping shift",
        )

        with pytest.raises(HTTPException) as exc_info:
            create_shift(db_session, shift_data, test_user)

        assert exc_info.value.status_code == 400
        assert "overlaps with an existing shift" in str(exc_info.value.detail)

    def test_edit_shift_success(self, db_session: Session, test_user, test_worksite):
        """Test successfully editing a shift."""
        # Create shift to edit
        shift = Shift(
            employee_id=test_user.id,
            title="Original Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Original shift",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        # Edit the shift
        edit_data = ShiftEditSchema(
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",
            worksite_id=test_worksite.id,
            employee_id=test_user.id,
            remarks="Updated shift",
        )

        result = edit_shift(db_session, shift.id, edit_data, test_user)

        assert result.id == shift.id
        assert result.date == "2024-01-16"
        assert result.shift_start == "10:00"
        assert result.shift_end == "18:00"
        assert result.remarks == "Updated shift"

    def test_edit_shift_not_found(self, db_session: Session, test_user, test_worksite):
        """Test editing a shift that doesn't exist."""
        edit_data = ShiftEditSchema(
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",
            worksite_id=test_worksite.id,
            employee_id=test_user.id,
            remarks="Updated shift",
        )

        with pytest.raises(HTTPException) as exc_info:
            edit_shift(db_session, 999, edit_data, test_user)

        assert exc_info.value.status_code == 404

    def test_delete_shift_success(self, db_session: Session, test_user, test_worksite):
        """Test successfully deleting a shift."""
        # Create shift to delete
        shift = Shift(
            employee_id=test_user.id,
            title="Shift to Delete",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Shift to delete",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()
        shift_id = shift.id

        # Delete the shift
        delete_shift(db_session, shift_id, test_user)

        # Verify shift is deleted
        deleted_shift = db_session.query(Shift).filter(Shift.id == shift_id).first()
        assert deleted_shift is None

    def test_delete_shift_not_found(self, db_session: Session, test_user):
        """Test deleting a shift that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            delete_shift(db_session, 999, test_user)

        assert exc_info.value.status_code == 404

    def test_list_shifts_empty_when_no_date_range(self, db_session: Session, test_user):
        """Test that list_shifts returns empty when no date range provided."""
        result = list_shifts(db_session, test_user.organization_id)

        assert result["pagination"]["total_items"] == 0
        assert result["data"] == []

    def test_list_shifts_with_date_range(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test listing shifts with date range."""
        # Create test shifts
        shift1 = Shift(
            employee_id=test_user.id,
            title="Shift 1",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="First shift",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Shift 2",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Second shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        result = list_shifts(
            db_session,
            test_user.organization_id,
            week_start="2024-01-15",
            week_end="2024-01-16",
        )

        assert result["pagination"]["total_items"] == 2
        assert len(result["data"]) == 2

    def test_list_call_ins_today_default(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test listing call-ins defaults to today when no date range provided."""
        today = date.today().isoformat()

        # Create a call-in for today
        shift = Shift(
            employee_id=test_user.id,
            title="Call-in Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date=today,
            shift_start="09:00",
            shift_end="17:00",
            remarks="Called in sick",
            called_in=True,
            call_in_reason="Sick",
        )
        db_session.add(shift)
        db_session.commit()

        result = list_call_ins(db_session, test_user.organization_id)

        assert result["pagination"]["total_items"] == 1
        assert len(result["data"]) == 1
        assert result["data"][0].called_in is True

    def test_list_call_ins_with_date_range(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test listing call-ins with specific date range."""
        # Create call-in shifts
        shift1 = Shift(
            employee_id=test_user.id,
            title="Call-in 1",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Called in",
            called_in=True,
            call_in_reason="Emergency",
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Regular Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="18:00",
            shift_end="22:00",
            remarks="Regular shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        result = list_call_ins(
            db_session,
            test_user.organization_id,
            start_date="2024-01-15",
            end_date="2024-01-15",
        )

        assert result["pagination"]["total_items"] == 1
        assert len(result["data"]) == 1
        assert result["data"][0].called_in is True
        assert result["data"][0].call_in_reason == "Emergency"
