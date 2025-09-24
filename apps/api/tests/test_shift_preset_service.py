"""
Tests for shift preset service.
"""

import pytest
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.apis.services.shift_preset import (
    create_shift_preset_group,
    get_shift_preset_group_by_id,
    list_shift_preset_groups,
    create_shift_preset,
    get_shift_preset_by_id,
    list_shift_presets,
)
from app.models.shift import ShiftPresetGroup, ShiftPreset
from app.models.user import User
from app.apis.dtos.shift_preset import (
    ShiftPresetGroupCreateSchema,
    ShiftPresetCreateSchema,
)


class TestShiftPresetService:
    """Test shift preset service functionality."""

    def test_get_shift_preset_group_by_id_success(
        self, db_session: Session, test_organization, test_worksite, user_factory
    ):
        """Test getting shift preset group by ID."""
        user = user_factory(organization_id=test_organization.id)

        # Create a shift preset group
        group = ShiftPresetGroup(
            title="Test Group",
            organization_id=test_organization.id,
            worksite_id=test_worksite.id,
        )
        db_session.add(group)
        db_session.commit()

        # Test getting the group
        result = get_shift_preset_group_by_id(
            db_session, group.id, test_organization.id
        )

        assert result is not None
        assert result.id == group.id
        assert result.title == "Test Group"

    def test_get_shift_preset_group_by_id_not_found(
        self, db_session: Session, test_organization
    ):
        """Test getting non-existent shift preset group."""
        with pytest.raises(HTTPException) as exc_info:
            get_shift_preset_group_by_id(db_session, 99999, test_organization.id)

        assert exc_info.value.status_code == 404

    def test_list_shift_preset_groups_empty(
        self, db_session: Session, test_organization
    ):
        """Test listing shift preset groups when none exist."""
        result, total = list_shift_preset_groups(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert isinstance(result, list)
        assert len(result) == 0
        assert total == 0

    def test_list_shift_preset_groups_with_data(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test listing shift preset groups with data."""
        # Create multiple groups
        for i in range(3):
            group = ShiftPresetGroup(
                title=f"Group {i + 1}",
                organization_id=test_organization.id,
                worksite_id=test_worksite.id,
            )
            db_session.add(group)

        db_session.commit()

        result, total = list_shift_preset_groups(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert len(result) == 3
        assert total == 3

    def test_get_shift_preset_by_id_success(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test getting shift preset by ID."""
        # Create a shift preset group first
        group = ShiftPresetGroup(
            title="Test Group",
            organization_id=test_organization.id,
            worksite_id=test_worksite.id,
        )
        db_session.add(group)
        db_session.flush()

        # Create a shift preset
        preset = ShiftPreset(
            title="Morning Shift",
            shift_start="09:00",
            shift_end="17:00",
            preset_group_id=group.id,
            employee_id=1,  # Assuming employee exists
            organization_id=test_organization.id,
            day_of_week=1,  # Monday
        )
        db_session.add(preset)
        db_session.commit()

        # Test getting the preset
        result = get_shift_preset_by_id(db_session, preset.id, test_organization.id)

        assert result is not None
        assert result.id == preset.id
        assert result.title == "Morning Shift"

    def test_get_shift_preset_by_id_not_found(
        self, db_session: Session, test_organization
    ):
        """Test getting non-existent shift preset."""
        with pytest.raises(HTTPException) as exc_info:
            get_shift_preset_by_id(db_session, 99999, test_organization.id)

        assert exc_info.value.status_code == 404

    def test_list_shift_presets_empty(self, db_session: Session, test_organization):
        """Test listing shift presets when none exist."""
        result = list_shift_presets(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert isinstance(result, list)
        assert len(result) == 0

    def test_list_shift_presets_with_data(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test listing shift presets with data."""
        # Create a shift preset group first
        group = ShiftPresetGroup(
            title="Test Group",
            organization_id=test_organization.id,
            worksite_id=test_worksite.id,
        )
        db_session.add(group)
        db_session.flush()

        # Create multiple presets
        for i in range(3):
            preset = ShiftPreset(
                title=f"Shift {i + 1}",
                shift_start="09:00",
                shift_end="17:00",
                preset_group_id=group.id,
                employee_id=1,  # Assuming employee exists
                organization_id=test_organization.id,
                day_of_week=i + 1,  # Different days
            )
            db_session.add(preset)

        db_session.commit()

        result = list_shift_presets(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert len(result) == 3

    def test_organization_isolation_preset_groups(
        self, db_session: Session, organization_factory, worksite_factory
    ):
        """Test that preset groups are isolated by organization."""
        org1 = organization_factory(name="Org 1")
        org2 = organization_factory(name="Org 2")

        # Create worksites for each organization
        worksite1 = worksite_factory(organization_id=org1.id)
        worksite2 = worksite_factory(organization_id=org2.id)

        # Create groups in different organizations
        group1 = ShiftPresetGroup(
            title="Org1 Group", organization_id=org1.id, worksite_id=worksite1.id
        )
        group2 = ShiftPresetGroup(
            title="Org2 Group", organization_id=org2.id, worksite_id=worksite2.id
        )
        db_session.add_all([group1, group2])
        db_session.commit()

        # List groups for org1 should only return org1's group
        result_org1, total_org1 = list_shift_preset_groups(
            db_session, org1.id, page=1, per_page=10
        )

        assert len(result_org1) == 1
        assert total_org1 == 1
        assert result_org1[0].title == "Org1 Group"

    def test_organization_isolation_presets(
        self, db_session: Session, organization_factory, worksite_factory
    ):
        """Test that presets are isolated by organization."""
        org1 = organization_factory(name="Org 1")
        org2 = organization_factory(name="Org 2")

        # Create worksites for each organization
        worksite1 = worksite_factory(organization_id=org1.id)
        worksite2 = worksite_factory(organization_id=org2.id)

        # Create groups and presets in different organizations
        group1 = ShiftPresetGroup(
            title="Org1 Group", organization_id=org1.id, worksite_id=worksite1.id
        )
        group2 = ShiftPresetGroup(
            title="Org2 Group", organization_id=org2.id, worksite_id=worksite2.id
        )
        db_session.add_all([group1, group2])
        db_session.flush()

        preset1 = ShiftPreset(
            title="Org1 Preset",
            shift_start="09:00",
            shift_end="17:00",
            preset_group_id=group1.id,
            employee_id=1,  # Assuming employee exists
            organization_id=org1.id,
            day_of_week=1,  # Monday
        )
        preset2 = ShiftPreset(
            title="Org2 Preset",
            shift_start="10:00",
            shift_end="18:00",
            preset_group_id=group2.id,
            employee_id=1,  # Assuming employee exists
            organization_id=org2.id,
            day_of_week=1,  # Monday
        )
        db_session.add_all([preset1, preset2])
        db_session.commit()

        # List presets for org1 should only return org1's preset
        result_org1 = list_shift_presets(db_session, org1.id, page=1, per_page=10)

        assert len(result_org1) == 1
        assert result_org1[0].title == "Org1 Preset"

    def test_pagination_preset_groups(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test pagination for preset groups."""
        # Create 15 groups
        for i in range(15):
            group = ShiftPresetGroup(
                title=f"Group {i + 1:02d}",
                organization_id=test_organization.id,
                worksite_id=test_worksite.id,
            )
            db_session.add(group)

        db_session.commit()

        # Test first page
        page1, total1 = list_shift_preset_groups(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert len(page1) == 10
        assert total1 == 15

        # Test second page
        page2, total2 = list_shift_preset_groups(
            db_session, test_organization.id, page=2, per_page=10
        )

        assert len(page2) == 5
        assert total2 == 15

    def test_pagination_presets(
        self, db_session: Session, test_organization, test_worksite
    ):
        """Test pagination for presets."""
        # Create a group first
        group = ShiftPresetGroup(
            title="Test Group",
            organization_id=test_organization.id,
            worksite_id=test_worksite.id,
        )
        db_session.add(group)
        db_session.flush()

        # Create 15 presets
        for i in range(15):
            preset = ShiftPreset(
                title=f"Preset {i + 1:02d}",
                shift_start="09:00",
                shift_end="17:00",
                preset_group_id=group.id,
                employee_id=1,  # Assuming employee exists
                organization_id=test_organization.id,
                day_of_week=(i % 7) + 1,  # Cycle through days
            )
            db_session.add(preset)

        db_session.commit()

        # Test first page
        page1 = list_shift_presets(
            db_session, test_organization.id, page=1, per_page=10
        )

        assert len(page1) == 10

        # Test second page
        page2 = list_shift_presets(
            db_session, test_organization.id, page=2, per_page=10
        )

        assert len(page2) == 5
