"""Tests for employee schedule service functions."""

import pytest
from datetime import date
from sqlalchemy.orm import Session

from app.apis.services.employee_schedule_service import get_employee_schedules
from app.models.shift import Shift, EmployeePunch


class TestEmployeeScheduleService:
    """Test employee schedule service functions."""

    def test_get_employee_schedules_basic(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test basic employee schedule retrieval."""
        # Create test shift
        shift = Shift(
            employee_id=test_user.id,
            title="Test Shift",
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

        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 1
        assert result[0].id == shift.id
        assert result[0].employee_id == test_user.id
        assert result[0].title == "Test Shift"
        assert result[0].date == "2024-01-15"
        assert result[0].shift_start == "09:00"
        assert result[0].shift_end == "17:00"
        assert result[0].worksite_id == test_worksite.id
        assert result[0].worksite_name == test_worksite.name
        assert result[0].remarks == "Regular shift"

    def test_get_employee_schedules_with_punch_data(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule retrieval with punch data."""
        # Create test shift
        shift = Shift(
            employee_id=test_user.id,
            title="Shift with Punch",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Shift with punch data",
            called_in=False,
        )
        db_session.add(shift)

        # Create corresponding punch data
        punch = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-15",
            punch_in_time="09:05",
            punch_out_time="17:10",
            overtime_hours=0.0,
        )
        db_session.add(punch)
        db_session.commit()

        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 1
        assert result[0].employee_punch_start == "09:05"
        assert result[0].employee_punch_end == "17:10"

    def test_get_employee_schedules_without_punch_data(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule retrieval without punch data."""
        # Create test shift without corresponding punch
        shift = Shift(
            employee_id=test_user.id,
            title="Shift without Punch",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="No punch data",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 1
        assert result[0].employee_punch_start is None
        assert result[0].employee_punch_end is None

    def test_get_employee_schedules_with_date_range(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule retrieval with date range filtering."""
        # Create shifts on different dates
        shift1 = Shift(
            employee_id=test_user.id,
            title="Shift 1",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",  # Inside range
            shift_start="09:00",
            shift_end="17:00",
            remarks="Inside range",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Shift 2",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-20",  # Inside range
            shift_start="10:00",
            shift_end="18:00",
            remarks="Inside range",
            called_in=False,
        )
        shift3 = Shift(
            employee_id=test_user.id,
            title="Shift 3",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-25",  # Outside range
            shift_start="11:00",
            shift_end="19:00",
            remarks="Outside range",
            called_in=False,
        )
        db_session.add_all([shift1, shift2, shift3])
        db_session.commit()

        # Query with date range
        result = get_employee_schedules(
            db_session,
            test_user.id,
            start_date=date(2024, 1, 15),
            end_date=date(2024, 1, 22),
        )

        # Should only return shifts within the date range
        assert len(result) == 2
        shift_dates = [r.date for r in result]
        assert "2024-01-15" in shift_dates
        assert "2024-01-20" in shift_dates
        assert "2024-01-25" not in shift_dates

    def test_get_employee_schedules_with_start_date_only(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule retrieval with start date only."""
        # Create shifts on different dates
        shift1 = Shift(
            employee_id=test_user.id,
            title="Early Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-10",  # Before start date
            shift_start="09:00",
            shift_end="17:00",
            remarks="Before start",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Later Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-20",  # After start date
            shift_start="10:00",
            shift_end="18:00",
            remarks="After start",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Query with start date only
        result = get_employee_schedules(
            db_session,
            test_user.id,
            start_date=date(2024, 1, 15),
        )

        # Should only return shifts on or after start date
        assert len(result) == 1
        assert result[0].date == "2024-01-20"

    def test_get_employee_schedules_with_end_date_only(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule retrieval with end date only."""
        # Create shifts on different dates
        shift1 = Shift(
            employee_id=test_user.id,
            title="Early Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-10",  # Before end date
            shift_start="09:00",
            shift_end="17:00",
            remarks="Before end",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Later Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-25",  # After end date
            shift_start="10:00",
            shift_end="18:00",
            remarks="After end",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Query with end date only
        result = get_employee_schedules(
            db_session,
            test_user.id,
            end_date=date(2024, 1, 20),
        )

        # Should only return shifts on or before end date
        assert len(result) == 1
        assert result[0].date == "2024-01-10"

    def test_get_employee_schedules_multiple_worksites(
        self, db_session: Session, test_user, test_worksite, worksite_factory
    ):
        """Test employee schedule retrieval with multiple worksites."""
        # Create another worksite
        worksite2 = worksite_factory(
            name="Second Worksite", organization_id=test_user.organization_id
        )

        # Create shifts at different worksites
        shift1 = Shift(
            employee_id=test_user.id,
            title="Shift at Worksite 1",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="First worksite",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Shift at Worksite 2",
            organization_id=test_user.organization_id,
            worksite_id=worksite2.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Second worksite",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 2

        # Find shifts by worksite
        worksite1_shift = next(
            (r for r in result if r.worksite_id == test_worksite.id), None
        )
        worksite2_shift = next(
            (r for r in result if r.worksite_id == worksite2.id), None
        )

        assert worksite1_shift is not None
        assert worksite1_shift.worksite_name == test_worksite.name

        assert worksite2_shift is not None
        assert worksite2_shift.worksite_name == worksite2.name

    def test_get_employee_schedules_no_results(self, db_session: Session, test_user):
        """Test employee schedule retrieval with no schedules."""
        result = get_employee_schedules(db_session, test_user.id)

        assert result == []

    def test_get_employee_schedules_employee_isolation(
        self, db_session: Session, test_user, user_factory, test_worksite
    ):
        """Test that schedules are isolated by employee."""
        # Create another user
        other_user = user_factory(
            email="other@example.com", organization_id=test_user.organization_id
        )

        # Create shifts for both users
        shift1 = Shift(
            employee_id=test_user.id,
            title="User 1 Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="First user",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=other_user.id,
            title="User 2 Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Second user",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Query for first user only
        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 1
        assert result[0].employee_id == test_user.id
        assert result[0].title == "User 1 Shift"

    def test_get_employee_schedules_partial_punch_data(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test employee schedule with partial punch data (punch in only)."""
        # Create test shift
        shift = Shift(
            employee_id=test_user.id,
            title="Partial Punch Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Partial punch",
            called_in=False,
        )
        db_session.add(shift)

        # Create punch with only punch in time
        punch = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-15",
            punch_in_time="09:05",
            punch_out_time="00:00",  # Not punched out yet
            overtime_hours=0.0,
        )
        db_session.add(punch)
        db_session.commit()

        result = get_employee_schedules(db_session, test_user.id)

        assert len(result) == 1
        assert result[0].employee_punch_start == "09:05"
        assert result[0].employee_punch_end == "00:00"
