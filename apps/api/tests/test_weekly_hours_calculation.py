"""Tests for weekly hours calculation service."""

import pytest
from datetime import datetime, date
from sqlalchemy.orm import Session

from app.apis.services.weekly_hours_calculation import calculate_weekly_hours
from app.models.shift import Shift, EmployeePunch
from app.models.weeklyhours import WeeklyHours


class TestWeeklyHoursCalculation:
    """Test weekly hours calculation service."""

    def test_calculate_weekly_hours_with_shifts_and_punches(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test calculating weekly hours with both shifts and punches."""
        # Create test shifts
        shift1 = Shift(
            employee_id=test_user.id,
            title="Morning Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Afternoon Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])

        # Create test punches
        punch1 = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-15",
            punch_in_time="09:00",
            punch_out_time="17:30",  # 8.5 hours
            overtime_hours=0.5,
        )
        punch2 = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-16",
            punch_in_time="10:00",
            punch_out_time="19:00",  # 9 hours
            overtime_hours=1.0,
        )
        db_session.add_all([punch1, punch2])
        db_session.commit()

        # Calculate weekly hours
        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Verify calculations
        assert result["employee_id"] == test_user.id
        assert result["organization_id"] == test_user.organization_id
        assert result["scheduled_hours"] == 16.0  # 8 + 8 hours
        assert result["worked_hours"] == 17.5  # 8.5 + 9 hours
        assert result["overtime_hours"] == 0.0  # max(0, 17.5 - 40) = 0

        # Verify database record was created
        weekly_record = (
            db_session.query(WeeklyHours)
            .filter(
                WeeklyHours.employee_id == test_user.id,
                WeeklyHours.week_start == date(2024, 1, 15),
            )
            .first()
        )

        assert weekly_record is not None
        assert weekly_record.scheduled_hours == 16.0
        assert weekly_record.worked_hours == 17.5
        assert weekly_record.overtime_hours == 0.0

    def test_calculate_weekly_hours_with_overtime(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test calculating weekly hours with overtime (>40 hours)."""
        # Create multiple shifts totaling more than 40 hours
        shifts = []
        punches = []

        for i in range(6):  # 6 days of work
            shift = Shift(
                employee_id=test_user.id,
                title=f"Shift {i + 1}",
                organization_id=test_user.organization_id,
                worksite_id=test_worksite.id,
                date=f"2024-01-{15 + i}",
                shift_start="09:00",
                shift_end="17:00",  # 8 hours each
                remarks="Regular shift",
                called_in=False,
            )
            shifts.append(shift)

            punch = EmployeePunch(
                employee_id=test_user.id,
                organization_id=test_user.organization_id,
                date=f"2024-01-{15 + i}",
                punch_in_time="09:00",
                punch_out_time="18:00",  # 9 hours each = 54 total
                overtime_hours=1.0,
            )
            punches.append(punch)

        db_session.add_all(shifts + punches)
        db_session.commit()

        # Calculate weekly hours
        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Verify calculations
        assert result["scheduled_hours"] == 48.0  # 6 * 8 hours
        assert result["worked_hours"] == 54.0  # 6 * 9 hours
        assert result["overtime_hours"] == 14.0  # 54 - 40 = 14 hours overtime

    def test_calculate_weekly_hours_no_data(self, db_session: Session, test_user):
        """Test calculating weekly hours with no shifts or punches."""
        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Verify calculations
        assert result["scheduled_hours"] == 0.0
        assert result["worked_hours"] == 0.0
        assert result["overtime_hours"] == 0.0

        # Verify database record was created
        weekly_record = (
            db_session.query(WeeklyHours)
            .filter(
                WeeklyHours.employee_id == test_user.id,
                WeeklyHours.week_start == date(2024, 1, 15),
            )
            .first()
        )

        assert weekly_record is not None
        assert weekly_record.scheduled_hours == 0.0

    def test_calculate_weekly_hours_shifts_only(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test calculating weekly hours with only shifts (no punches)."""
        # Create test shifts
        shift1 = Shift(
            employee_id=test_user.id,
            title="Morning Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Afternoon Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="14:00",  # 4 hours
            remarks="Short shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Verify calculations
        assert result["scheduled_hours"] == 12.0  # 8 + 4 hours
        assert result["worked_hours"] == 0.0  # No punches
        assert result["overtime_hours"] == 0.0

    def test_calculate_weekly_hours_punches_only(self, db_session: Session, test_user):
        """Test calculating weekly hours with only punches (no shifts)."""
        # Create test punches
        punch1 = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-15",
            punch_in_time="09:00",
            punch_out_time="17:00",  # 8 hours
            overtime_hours=0.0,
        )
        punch2 = EmployeePunch(
            employee_id=test_user.id,
            organization_id=test_user.organization_id,
            date="2024-01-16",
            punch_in_time="10:00",
            punch_out_time="15:00",  # 5 hours
            overtime_hours=0.0,
        )
        db_session.add_all([punch1, punch2])
        db_session.commit()

        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Verify calculations
        assert result["scheduled_hours"] == 0.0  # No shifts
        assert result["worked_hours"] == 13.0  # 8 + 5 hours
        assert result["overtime_hours"] == 0.0  # 13 < 40

    def test_calculate_weekly_hours_different_employee(
        self, db_session: Session, test_user, user_factory, test_worksite
    ):
        """Test that calculation is isolated by employee."""
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
            shift_end="17:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=other_user.id,
            title="User 2 Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="10:00",
            shift_end="14:00",  # 4 hours
            remarks="Short shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Calculate weekly hours for first user only
        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Should only include first user's shift
        assert result["scheduled_hours"] == 8.0  # Only shift1
        assert result["worked_hours"] == 0.0
        assert result["overtime_hours"] == 0.0

    def test_calculate_weekly_hours_date_range_filtering(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test that date range filtering works correctly."""
        # Create shifts inside and outside the date range
        shift_inside = Shift(
            employee_id=test_user.id,
            title="Inside Range",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-16",  # Inside range
            shift_start="09:00",
            shift_end="17:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        shift_outside = Shift(
            employee_id=test_user.id,
            title="Outside Range",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-22",  # Outside range
            shift_start="09:00",
            shift_end="17:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        db_session.add_all([shift_inside, shift_outside])
        db_session.commit()

        result = calculate_weekly_hours(
            db_session,
            test_user.id,
            test_user.organization_id,
            "2024-01-15",
            "2024-01-21",
        )

        # Should only include shift inside the range
        assert result["scheduled_hours"] == 8.0  # Only shift_inside
        assert result["worked_hours"] == 0.0
        assert result["overtime_hours"] == 0.0
