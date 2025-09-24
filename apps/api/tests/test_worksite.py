"""Worksite management endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from app.models.worksite import WorkSite


class TestWorksiteEndpoints:
    """Test worksite management endpoints."""

    def test_create_worksite_success(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test creating a new worksite."""
        worksite_data = {
            "name": "Test Worksite",
            "address": "123 Work Street",
            "city": "Work City",
            "state": "WS",
            "zip_code": "12345",
            "contact_person": "John Contact",
            "contact_phone": "555-0123",
            "status": "Active",
        }

        response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == worksite_data["name"]
        assert data["address"] == worksite_data["address"]
        assert data["organization_id"] == test_organization.id

    def test_create_worksite_unauthorized(self, client: TestClient):
        """Test creating worksite without authentication."""
        worksite_data = {
            "name": "Unauthorized Worksite",
            "address": "123 Unauth Street",
            "city": "Unauth City",
            "state": "UC",
            "zip_code": "54321",
            "contact_person": "No Auth",
            "contact_phone": "555-9999",
            "status": "Active",
        }

        response = client.post("/api/worksite", json=worksite_data)

        assert response.status_code == 401

    def test_create_worksite_invalid_data(self, client: TestClient, owner_auth_headers):
        """Test creating worksite with invalid data."""
        worksite_data = {
            "name": "",  # Invalid: empty name
            "address": "",  # Invalid: empty address
            "city": "",  # Invalid: empty city
            "state": "",  # Invalid: empty state
            "zip_code": "",  # Invalid: empty zip
            "contact_person": "",  # Invalid: empty contact
            "contact_phone": "",  # Invalid: empty phone
            "status": "INVALID_STATUS",  # Invalid: bad status
        }

        response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )

        assert response.status_code == 422

    def test_get_worksites_success(self, client: TestClient, owner_auth_headers):
        """Test getting list of worksites."""
        # First create some worksites
        worksite1_data = {
            "name": "Worksite 1",
            "address": "123 First Street",
            "city": "First City",
            "state": "FC",
            "zip_code": "11111",
            "contact_person": "First Contact",
            "contact_phone": "555-0001",
            "status": "Active",
        }

        worksite2_data = {
            "name": "Worksite 2",
            "address": "456 Second Street",
            "city": "Second City",
            "state": "SC",
            "zip_code": "22222",
            "contact_person": "Second Contact",
            "contact_phone": "555-0002",
            "status": "Inactive",
        }

        client.post("/api/worksite", json=worksite1_data, headers=owner_auth_headers)
        client.post("/api/worksite", json=worksite2_data, headers=owner_auth_headers)

        response = client.get("/api/worksite", headers=owner_auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2

    def test_get_worksites_unauthorized(self, client: TestClient):
        """Test getting worksites without authentication."""
        response = client.get("/api/worksite")

        assert response.status_code == 401

    def test_get_worksite_by_id_success(self, client: TestClient, owner_auth_headers):
        """Test getting specific worksite by ID."""
        # Create a worksite first
        worksite_data = {
            "name": "Specific Worksite",
            "address": "789 Specific Street",
            "city": "Specific City",
            "state": "SP",
            "zip_code": "78901",
            "contact_person": "Specific Contact",
            "contact_phone": "555-0789",
            "status": "Active",
        }

        create_response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )
        worksite = create_response.json()
        worksite_id = worksite["id"]

        response = client.get(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == worksite_id
        assert data["name"] == worksite_data["name"]

    def test_get_worksite_by_id_not_found(self, client: TestClient, owner_auth_headers):
        """Test getting non-existent worksite."""
        response = client.get("/api/worksite/99999", headers=owner_auth_headers)

        assert response.status_code == 404

    def test_update_worksite_success(self, client: TestClient, owner_auth_headers):
        """Test updating worksite information."""
        # Create a worksite first
        worksite_data = {
            "name": "Update Worksite",
            "address": "123 Update Street",
            "city": "Update City",
            "state": "UP",
            "zip_code": "12345",
            "contact_person": "Update Contact",
            "contact_phone": "555-1234",
            "status": "Active",
        }

        create_response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )
        worksite = create_response.json()
        worksite_id = worksite["id"]

        update_data = {
            "id": worksite_id,
            "name": "Updated Worksite Name",
            "address": "456 Updated Street",
            "city": "Updated City",
            "state": "UD",
            "zip_code": "54321",
            "contact_person": "Updated Contact",
            "contact_phone": "555-4321",
            "status": "Inactive",
        }

        response = client.put(
            f"/api/worksite/{worksite_id}", json=update_data, headers=owner_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Worksite Name"
        assert data["status"] == "Inactive"

    def test_update_worksite_not_found(self, client: TestClient, owner_auth_headers):
        """Test updating non-existent worksite."""
        update_data = {
            "id": 99999,
            "name": "Not Found Worksite",
            "address": "123 Not Found Street",
            "city": "Not Found City",
            "state": "NF",
            "zip_code": "00000",
            "contact_person": "Not Found",
            "contact_phone": "555-0000",
            "status": "Active",
        }

        response = client.put(
            "/api/worksite/99999", json=update_data, headers=owner_auth_headers
        )

        assert response.status_code == 404

    def test_delete_worksite_success(self, client: TestClient, owner_auth_headers):
        """Test deleting a worksite."""
        # Create a worksite first
        worksite_data = {
            "name": "Delete Worksite",
            "address": "123 Delete Street",
            "city": "Delete City",
            "state": "DL",
            "zip_code": "99999",
            "contact_person": "Delete Contact",
            "contact_phone": "555-9999",
            "status": "Active",
        }

        create_response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )
        worksite = create_response.json()
        worksite_id = worksite["id"]

        response = client.delete(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )

        assert response.status_code == 200

        # Verify worksite is deleted
        get_response = client.get(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )
        assert get_response.status_code == 404

    def test_delete_worksite_not_found(self, client: TestClient, owner_auth_headers):
        """Test deleting non-existent worksite."""
        response = client.delete("/api/worksite/99999", headers=owner_auth_headers)

        assert response.status_code == 404

    def test_worksite_access_control(self, client: TestClient, auth_headers):
        """Test that regular employees have limited access to worksite endpoints."""
        worksite_data = {
            "name": "Employee Access Test",
            "address": "123 Access Street",
            "city": "Access City",
            "state": "AC",
            "zip_code": "11111",
            "contact_person": "Access Contact",
            "contact_phone": "555-1111",
            "status": "Active",
        }

        # Regular employee should not be able to create worksites
        response = client.post(
            "/api/worksite", json=worksite_data, headers=auth_headers
        )

        # Should be forbidden (403) or unauthorized (401)
        assert response.status_code in [401, 403]


class TestWorksiteModels:
    """Test worksite model functionality."""

    def test_worksite_creation(self, db_session, test_organization):
        """Test creating worksite model."""
        worksite = WorkSite(
            name="Model Test Worksite",
            address="123 Model Street",
            city="Model City",
            state="MC",
            zip_code="12345",
            contact_person="Model Contact",
            contact_phone="555-0123",
            status="Active",
            organization_id=test_organization.id,
        )

        db_session.add(worksite)
        db_session.commit()
        db_session.refresh(worksite)

        assert worksite.id is not None
        assert worksite.name == "Model Test Worksite"
        assert worksite.organization_id == test_organization.id

    def test_worksite_status_enum(self, db_session, test_organization):
        """Test worksite status enumeration."""
        active_worksite = WorkSite(
            name="Active Worksite",
            address="123 Active Street",
            city="Active City",
            state="AC",
            zip_code="11111",
            contact_person="Active Contact",
            contact_phone="555-1111",
            status="Active",
            organization_id=test_organization.id,
        )

        inactive_worksite = WorkSite(
            name="Inactive Worksite",
            address="456 Inactive Street",
            city="Inactive City",
            state="IC",
            zip_code="22222",
            contact_person="Inactive Contact",
            contact_phone="555-2222",
            status="Inactive",
            organization_id=test_organization.id,
        )

        db_session.add_all([active_worksite, inactive_worksite])
        db_session.commit()

        assert active_worksite.status == "Active"
        assert inactive_worksite.status == "Inactive"


@pytest.mark.integration
class TestWorksiteIntegration:
    """Integration tests for worksite management."""

    def test_worksite_lifecycle(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test complete worksite lifecycle: create, read, update, delete."""
        # Create worksite
        worksite_data = {
            "name": "Lifecycle Worksite",
            "address": "123 Lifecycle Street",
            "city": "Lifecycle City",
            "state": "LC",
            "zip_code": "12345",
            "contact_person": "Lifecycle Contact",
            "contact_phone": "555-0123",
            "status": "Active",
        }

        create_response = client.post(
            "/api/worksite", json=worksite_data, headers=owner_auth_headers
        )
        assert create_response.status_code == 201
        worksite = create_response.json()
        worksite_id = worksite["id"]

        # Read worksite
        read_response = client.get(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )
        assert read_response.status_code == 200
        assert read_response.json()["name"] == worksite_data["name"]

        # Update worksite
        update_data = {
            "id": worksite_id,
            "name": "Updated Lifecycle Worksite",
            "address": "456 Updated Street",
            "city": "Updated City",
            "state": "UC",
            "zip_code": "54321",
            "contact_person": "Updated Contact",
            "contact_phone": "555-4321",
            "status": "Inactive",
        }

        update_response = client.put(
            f"/api/worksite/{worksite_id}", json=update_data, headers=owner_auth_headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Lifecycle Worksite"

        # Delete worksite
        delete_response = client.delete(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )
        assert delete_response.status_code == 200

        # Verify deletion
        read_after_delete = client.get(
            f"/api/worksite/{worksite_id}", headers=owner_auth_headers
        )
        assert read_after_delete.status_code == 404

    def test_organization_worksite_isolation(
        self, client: TestClient, organization_factory, user_factory
    ):
        """Test that worksites are isolated by organization."""
        # Create two organizations with owners
        org1 = organization_factory(name="Org 1", abbreviation="O1")
        org2 = organization_factory(name="Org 2", abbreviation="O2")

        owner1 = user_factory(
            email="owner1@org1.com", organization_id=org1.id, is_owner=True
        )
        owner2 = user_factory(
            email="owner2@org2.com", organization_id=org2.id, is_owner=True
        )

        # Create auth headers for both owners
        from tests.fixtures.auth import create_test_access_token

        token1 = create_test_access_token(
            {"email": owner1.email, "user_id": owner1.id, "is_owner": owner1.is_owner}
        )

        token2 = create_test_access_token(
            {"email": owner2.email, "user_id": owner2.id, "is_owner": owner2.is_owner}
        )

        headers1 = {"Authorization": f"Bearer {token1}"}
        headers2 = {"Authorization": f"Bearer {token2}"}

        # Create worksites in each organization
        worksite1_data = {
            "name": "Org 1 Worksite",
            "address": "123 Org1 Street",
            "city": "Org1 City",
            "state": "O1",
            "zip_code": "11111",
            "contact_person": "Org1 Contact",
            "contact_phone": "555-1111",
            "status": "Active",
        }

        worksite2_data = {
            "name": "Org 2 Worksite",
            "address": "456 Org2 Street",
            "city": "Org2 City",
            "state": "O2",
            "zip_code": "22222",
            "contact_person": "Org2 Contact",
            "contact_phone": "555-2222",
            "status": "Active",
        }

        create1_response = client.post(
            "/api/worksite", json=worksite1_data, headers=headers1
        )
        create2_response = client.post(
            "/api/worksite", json=worksite2_data, headers=headers2
        )

        assert create1_response.status_code == 201
        assert create2_response.status_code == 201

        worksite1 = create1_response.json()
        worksite2 = create2_response.json()

        # Verify organization isolation
        assert worksite1["organization_id"] == org1.id
        assert worksite2["organization_id"] == org2.id

        # Owner 1 should not be able to access Owner 2's worksite
        cross_access_response = client.get(
            f"/api/worksite/{worksite2['id']}", headers=headers1
        )
        assert cross_access_response.status_code in [403, 404]
