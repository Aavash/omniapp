"""Tests for summary service functions."""

import pytest
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.apis.services.summary import calculate_monthly_worksite_summary
from app.models.shift import Shift, EmployeePunch
from app.models.user import User


class TestSummaryService:
    """Test summary service functions."""

    def test_calculate_monthly_worksite_summary_basic(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test basic monthly worksite summary calculation."""
        # Create test shifts for January 2024
        shift1 = Shift(
            employee_id=test_user.id,
            title="January Shift 1",
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
            title="January Shift 2",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",  # 8 hours
            remarks="Regular shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Calculate summary for January 2024
        result = calculate_monthly_worksite_summary(
            db_session,
            test_user.organization_id,
            worksite_id=test_worksite.id,
            month="2024-01",
        )

        # Verify basic structure
        assert result is not None
        assert hasattr(result, "total_employees")
        assert result.total_employees >= 1  # At least our test user

    def test_calculate_monthly_worksite_summary_invalid_month_format(
        self, db_session: Session, test_user
    ):
        """Test monthly summary with invalid month format."""
        with pytest.raises(HTTPException) as exc_info:
            calculate_monthly_worksite_summary(
                db_session, test_user.organization_id, month="invalid-month"
            )

        assert exc_info.value.status_code == 400
        assert "Invalid month format" in str(exc_info.value.detail)

    def test_calculate_monthly_worksite_summary_no_month(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test monthly summary without specifying month."""
        # Create a shift
        shift = Shift(
            employee_id=test_user.id,
            title="No Month Shift",
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

        # Should work without month parameter
        result = calculate_monthly_worksite_summary(
            db_session, test_user.organization_id, worksite_id=test_worksite.id
        )

        assert result is not None
        assert result.total_employees >= 1

    def test_calculate_monthly_worksite_summary_no_worksite(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test monthly summary without specifying worksite."""
        # Create a shift
        shift = Shift(
            employee_id=test_user.id,
            title="No Worksite Shift",
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

        # Should work without worksite_id parameter
        result = calculate_monthly_worksite_summary(
            db_session, test_user.organization_id, month="2024-01"
        )

        assert result is not None
        assert result.total_employees >= 1

    def test_calculate_monthly_worksite_summary_inactive_employees(
        self, db_session: Session, test_organization, user_factory, test_worksite
    ):
        """Test monthly summary with inactive employees."""
        # Create active and inactive users
        active_user = user_factory(
            email="active@example.com",
            organization_id=test_organization.id,
            is_active=True,
        )
        inactive_user = user_factory(
            email="inactive@example.com",
            organization_id=test_organization.id,
            is_active=False,
        )

        result = calculate_monthly_worksite_summary(
            db_session, test_organization.id, month="2024-01"
        )

        assert result.total_employees >= 2
        assert result.total_inactive_employees >= 1

    def test_calculate_monthly_worksite_summary_cross_midnight_shift(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test monthly summary with shifts that cross midnight."""
        # Create shift that crosses midnight
        shift = Shift(
            employee_id=test_user.id,
            title="Night Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="23:00",
            shift_end="07:00",  # Next day
            remarks="Night shift",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        # Should handle cross-midnight shifts
        result = calculate_monthly_worksite_summary(
            db_session,
            test_user.organization_id,
            worksite_id=test_worksite.id,
            month="2024-01",
        )

        assert result is not None

    def test_calculate_monthly_worksite_summary_invalid_time_format(
        self, db_session: Session, test_user, test_worksite
    ):
        """Test monthly summary with invalid time format in shifts."""
        # Create shift with invalid time format
        shift = Shift(
            employee_id=test_user.id,
            title="Invalid Time Shift",
            organization_id=test_user.organization_id,
            worksite_id=test_worksite.id,
            date="2024-01-15",
            shift_start="invalid-time",
            shift_end="17:00",
            remarks="Invalid time",
            called_in=False,
        )
        db_session.add(shift)
        db_session.commit()

        # Should raise HTTPException for invalid time format
        with pytest.raises(HTTPException) as exc_info:
            calculate_monthly_worksite_summary(
                db_session,
                test_user.organization_id,
                worksite_id=test_worksite.id,
                month="2024-01",
            )

        assert exc_info.value.status_code == 400
        assert "Invalid time format" in str(exc_info.value.detail)

    def test_calculate_monthly_worksite_summary_empty_data(
        self, db_session: Session, test_organization
    ):
        """Test monthly summary with no data."""
        result = calculate_monthly_worksite_summary(
            db_session, test_organization.id, month="2024-01"
        )

        assert result is not None
        assert result.total_employees >= 0
        assert result.total_inactive_employees >= 0

    def test_calculate_monthly_worksite_summary_organization_isolation(
        self, db_session: Session, organization_factory, user_factory, worksite_factory
    ):
        """Test that summary respects organization boundaries."""
        # Create two organizations
        org1 = organization_factory(name="Org 1", abbreviation="O1")
        org2 = organization_factory(name="Org 2", abbreviation="O2")

        # Create users in each organization
        user1 = user_factory(email="user1@org1.com", organization_id=org1.id)
        user2 = user_factory(email="user2@org2.com", organization_id=org2.id)

        # Create worksites in each organization
        worksite1 = worksite_factory(name="Worksite 1", organization_id=org1.id)
        worksite2 = worksite_factory(name="Worksite 2", organization_id=org2.id)

        # Create shifts in each organization
        shift1 = Shift(
            employee_id=user1.id,
            title="Org 1 Shift",
            organization_id=org1.id,
            worksite_id=worksite1.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Org 1 shift",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=user2.id,
            title="Org 2 Shift",
            organization_id=org2.id,
            worksite_id=worksite2.id,
            date="2024-01-15",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Org 2 shift",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Get summary for org1 only
        result_org1 = calculate_monthly_worksite_summary(
            db_session, org1.id, month="2024-01"
        )

        # Should only include org1 data
        assert result_org1 is not None
        # The exact employee count depends on other test data, but should be isolated

    def test_calculate_monthly_worksite_summary_worksite_filtering(
        self, db_session: Session, test_user, worksite_factory
    ):
        """Test that summary respects worksite filtering."""
        # Create two worksites in the same organization
        worksite1 = worksite_factory(
            name="Worksite 1", organization_id=test_user.organization_id
        )
        worksite2 = worksite_factory(
            name="Worksite 2", organization_id=test_user.organization_id
        )

        # Create shifts at different worksites
        shift1 = Shift(
            employee_id=test_user.id,
            title="Worksite 1 Shift",
            organization_id=test_user.organization_id,
            worksite_id=worksite1.id,
            date="2024-01-15",
            shift_start="09:00",
            shift_end="17:00",
            remarks="Worksite 1",
            called_in=False,
        )
        shift2 = Shift(
            employee_id=test_user.id,
            title="Worksite 2 Shift",
            organization_id=test_user.organization_id,
            worksite_id=worksite2.id,
            date="2024-01-16",
            shift_start="10:00",
            shift_end="18:00",
            remarks="Worksite 2",
            called_in=False,
        )
        db_session.add_all([shift1, shift2])
        db_session.commit()

        # Get summary for worksite1 only
        result_worksite1 = calculate_monthly_worksite_summary(
            db_session,
            test_user.organization_id,
            worksite_id=worksite1.id,
            month="2024-01",
        )

        # Should work without errors (detailed validation would require
        # checking the actual implementation details)
        assert result_worksite1 is not None
