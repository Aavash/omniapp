"""Tests for worksite service functions."""

import pytest
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.apis.services.worksite import (
    get_worksite_by_id,
    create_worksite,
    edit_worksite,
    delete_worksite,
    list_worksites,
)
from app.apis.dtos.worksite import WorkSiteCreateSchema, WorkSiteEditSchema, Status
from app.models.worksite import WorkSite


class TestWorksiteService:
    """Test worksite service functions."""

    def test_get_worksite_by_id_success(self, db_session: Session, test_worksite):
        """Test successfully getting a worksite by ID."""
        result = get_worksite_by_id(db_session, test_worksite.id)

        assert result is not None
        assert result.id == test_worksite.id
        assert result.name == test_worksite.name

    def test_get_worksite_by_id_not_found(self, db_session: Session):
        """Test getting a worksite that doesn't exist."""
        with pytest.raises(HTTPException) as exc_info:
            get_worksite_by_id(db_session, 99999)

        assert exc_info.value.status_code == 404
        assert "WorkSite not found" in str(exc_info.value.detail)

    def test_create_worksite_success(self, db_session: Session, test_organization):
        """Test successfully creating a worksite."""
        worksite_data = WorkSiteCreateSchema(
            name="New Worksite",
            address="123 New Street",
            city="New City",
            state="NS",
            zip_code="12345",
            contact_person="New Contact",
            contact_phone="555-0123",
            status=Status.ACTIVE,
        )

        result = create_worksite(db_session, worksite_data, test_organization.id)

        assert result is not None
        assert result.id is not None
        assert result.name == "New Worksite"
        assert result.address == "123 New Street"
        assert result.city == "New City"
        assert result.state == "NS"
        assert result.zip_code == "12345"
        assert result.contact_person == "New Contact"
        assert result.contact_phone == "555-0123"
        assert result.status == Status.ACTIVE
        assert result.organization_id == test_organization.id

        # Verify it was saved to database
        db_worksite = (
            db_session.query(WorkSite).filter(WorkSite.id == result.id).first()
        )
        assert db_worksite is not None

    def test_create_worksite_inactive_status(
        self, db_session: Session, test_organization
    ):
        """Test creating a worksite with inactive status."""
        worksite_data = WorkSiteCreateSchema(
            name="Inactive Worksite",
            address="456 Inactive Street",
            city="Inactive City",
            state="IC",
            zip_code="54321",
            contact_person="Inactive Contact",
            contact_phone="555-9999",
            status=Status.INACTIVE,
        )

        result = create_worksite(db_session, worksite_data, test_organization.id)

        assert result.status == Status.INACTIVE

    def test_edit_worksite_success(self, db_session: Session, test_worksite):
        """Test successfully editing a worksite."""
        edit_data = WorkSiteEditSchema(
            id=test_worksite.id,
            name="Updated Worksite Name",
            address="Updated Address",
            city="Updated City",
            state="UC",
            zip_code="99999",
            contact_person="Updated Contact",
            contact_phone="555-8888",
            status=Status.INACTIVE,
        )

        result = edit_worksite(db_session, edit_data, test_worksite)

        assert result.id == test_worksite.id
        assert result.name == "Updated Worksite Name"
        assert result.address == "Updated Address"
        assert result.city == "Updated City"
        assert result.state == "UC"
        assert result.zip_code == "99999"
        assert result.contact_person == "Updated Contact"
        assert result.contact_phone == "555-8888"
        assert result.status == Status.INACTIVE

    def test_edit_worksite_partial_update(self, db_session: Session, test_worksite):
        """Test editing a worksite with partial data."""
        original_address = test_worksite.address
        original_city = test_worksite.city

        edit_data = WorkSiteEditSchema(
            id=test_worksite.id,
            name="Partially Updated Name",
            # Not updating other fields
        )

        result = edit_worksite(db_session, edit_data, test_worksite)

        assert result.name == "Partially Updated Name"
        assert result.address == original_address  # Should remain unchanged
        assert result.city == original_city  # Should remain unchanged

    def test_edit_worksite_no_changes(self, db_session: Session, test_worksite):
        """Test editing a worksite with no actual changes."""
        original_name = test_worksite.name

        edit_data = WorkSiteEditSchema(
            id=test_worksite.id,
            # No fields to update
        )

        result = edit_worksite(db_session, edit_data, test_worksite)

        assert result.name == original_name  # Should remain unchanged

    def test_delete_worksite_success(self, db_session: Session, test_worksite):
        """Test successfully deleting a worksite."""
        worksite_id = test_worksite.id

        delete_worksite(db_session, test_worksite)

        # Verify worksite was deleted
        deleted_worksite = (
            db_session.query(WorkSite).filter(WorkSite.id == worksite_id).first()
        )
        assert deleted_worksite is None

    def test_list_worksites_basic(
        self, db_session: Session, test_organization, worksite_factory
    ):
        """Test basic worksite listing."""
        # Create test worksites
        worksite1 = worksite_factory(
            name="Worksite 1", organization_id=test_organization.id
        )
        worksite2 = worksite_factory(
            name="Worksite 2", organization_id=test_organization.id
        )

        result = list_worksites(db_session, test_organization.id)

        assert len(result) >= 2
        worksite_names = [ws.name for ws in result]
        assert "Worksite 1" in worksite_names
        assert "Worksite 2" in worksite_names

    def test_list_worksites_with_pagination(
        self, db_session: Session, test_organization, worksite_factory
    ):
        """Test worksite listing with pagination."""
        # Create multiple worksites
        for i in range(5):
            worksite_factory(
                name=f"Paginated Worksite {i}", organization_id=test_organization.id
            )

        # Get first page with 2 items per page
        result = list_worksites(db_session, test_organization.id, page=1, per_page=2)

        assert len(result) == 2

        # Get second page
        result_page2 = list_worksites(
            db_session, test_organization.id, page=2, per_page=2
        )

        assert len(result_page2) == 2
        # Should be different worksites
        assert result[0].id != result_page2[0].id

    def test_list_worksites_with_search(
        self, db_session: Session, test_organization, worksite_factory
    ):
        """Test worksite listing with search query."""
        # Create worksites with different names
        searchable_worksite = worksite_factory(
            name="Searchable Worksite",
            address="123 Searchable Street",
            organization_id=test_organization.id,
        )
        other_worksite = worksite_factory(
            name="Other Worksite",
            address="456 Other Street",
            organization_id=test_organization.id,
        )

        # Search by name
        result = list_worksites(
            db_session, test_organization.id, search_query="Searchable"
        )

        assert len(result) >= 1
        found_worksite = next(
            (ws for ws in result if ws.id == searchable_worksite.id), None
        )
        assert found_worksite is not None

        # Search by address
        result_address = list_worksites(
            db_session, test_organization.id, search_query="Searchable Street"
        )

        assert len(result_address) >= 1
        found_by_address = next(
            (ws for ws in result_address if ws.id == searchable_worksite.id), None
        )
        assert found_by_address is not None

    def test_list_worksites_with_sorting(
        self, db_session: Session, test_organization, worksite_factory
    ):
        """Test worksite listing with sorting."""
        # Create worksites with different names
        worksite_a = worksite_factory(
            name="Alpha Worksite", organization_id=test_organization.id
        )
        worksite_z = worksite_factory(
            name="Zulu Worksite", organization_id=test_organization.id
        )

        # Sort by name ascending
        result_asc = list_worksites(
            db_session, test_organization.id, sort_by="name", sort_order="asc"
        )

        # Find positions of our test worksites
        names = [ws.name for ws in result_asc]
        alpha_index = next((i for i, name in enumerate(names) if "Alpha" in name), -1)
        zulu_index = next((i for i, name in enumerate(names) if "Zulu" in name), -1)

        if alpha_index != -1 and zulu_index != -1:
            assert alpha_index < zulu_index

        # Sort by name descending
        result_desc = list_worksites(
            db_session, test_organization.id, sort_by="name", sort_order="desc"
        )

        names_desc = [ws.name for ws in result_desc]
        alpha_index_desc = next(
            (i for i, name in enumerate(names_desc) if "Alpha" in name), -1
        )
        zulu_index_desc = next(
            (i for i, name in enumerate(names_desc) if "Zulu" in name), -1
        )

        if alpha_index_desc != -1 and zulu_index_desc != -1:
            assert zulu_index_desc < alpha_index_desc

    def test_list_worksites_organization_isolation(
        self, db_session: Session, organization_factory, worksite_factory
    ):
        """Test that worksite listing respects organization boundaries."""
        # Create two organizations
        org1 = organization_factory(name="Org 1", abbreviation="O1")
        org2 = organization_factory(name="Org 2", abbreviation="O2")

        # Create worksites in each organization
        worksite1 = worksite_factory(name="Org 1 Worksite", organization_id=org1.id)
        worksite2 = worksite_factory(name="Org 2 Worksite", organization_id=org2.id)

        # List worksites for org1
        org1_worksites = list_worksites(db_session, org1.id)
        org1_worksite_ids = [ws.id for ws in org1_worksites]

        # Should only contain org1's worksite
        assert worksite1.id in org1_worksite_ids
        assert worksite2.id not in org1_worksite_ids

        # List worksites for org2
        org2_worksites = list_worksites(db_session, org2.id)
        org2_worksite_ids = [ws.id for ws in org2_worksites]

        # Should only contain org2's worksite
        assert worksite2.id in org2_worksite_ids
        assert worksite1.id not in org2_worksite_ids

    def test_list_worksites_empty_result(
        self, db_session: Session, organization_factory
    ):
        """Test worksite listing with no worksites."""
        # Create organization with no worksites
        empty_org = organization_factory(name="Empty Org", abbreviation="EO")

        result = list_worksites(db_session, empty_org.id)

        assert result == []

    def test_list_worksites_invalid_sort_column(
        self, db_session: Session, test_organization
    ):
        """Test worksite listing with invalid sort column."""
        # Should fall back to default sorting (by id)
        result = list_worksites(
            db_session, test_organization.id, sort_by="invalid_column"
        )

        # Should not raise an error and return results
        assert isinstance(result, list)
