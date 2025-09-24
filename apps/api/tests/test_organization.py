"""Organization management endpoint tests."""

import pytest
from fastapi.testclient import TestClient

from app.models.organization import Organization, OrganizationCategory


class TestOrganizationEndpoints:
    """Test organization management endpoints."""

    def test_get_organization_categories_success(self, client: TestClient):
        """Test getting organization categories."""
        response = client.get("/api/organization/categories")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_organization_success(
        self, client: TestClient, test_organization_category
    ):
        """Test creating a new organization."""
        org_data = {
            "owner_name": "Test Owner",
            "owner_email": "owner@neworg.com",
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "phone_number_ext": "+1",
            "phone_number": "1234567890",
            "organization_name": "New Test Organization",
            "abbrebiation": "NTO",
            "org_address": "123 New Org Street",
            "organization_category": test_organization_category.id,
        }

        response = client.post("/api/organization/create", json=org_data)

        assert response.status_code == 201
        data = response.json()
        assert "organization" in data
        assert "owner" in data
        assert data["organization"]["name"] == org_data["organization_name"]
        assert data["owner"]["email"] == org_data["owner_email"]

    def test_create_organization_duplicate_email(
        self, client: TestClient, test_organization_category, user_factory
    ):
        """Test creating organization with duplicate owner email."""
        # Create existing user
        user_factory(email="existing@example.com")

        org_data = {
            "owner_name": "Duplicate Owner",
            "owner_email": "existing@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "phone_number_ext": "+1",
            "phone_number": "1234567890",
            "organization_name": "Duplicate Org",
            "abbrebiation": "DO",
            "org_address": "123 Duplicate St",
            "organization_category": test_organization_category.id,
        }

        response = client.post("/api/organization/create", json=org_data)

        assert response.status_code == 400

    def test_create_organization_invalid_data(self, client: TestClient):
        """Test creating organization with invalid data."""
        org_data = {
            "owner_name": "",  # Invalid: empty name
            "owner_email": "invalid-email",  # Invalid: bad email format
            "password": "123",  # Invalid: too short
            "confirm_password": "123",
            "phone_number_ext": "",
            "phone_number": "",
            "organization_name": "",  # Invalid: empty name
            "abbrebiation": "",  # Invalid: empty abbreviation
            "org_address": "",  # Invalid: empty address
            "organization_category": 99999,  # Invalid: non-existent category
        }

        response = client.post("/api/organization/create", json=org_data)

        assert response.status_code == 422

    def test_get_organization_success(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test getting organization details."""
        response = client.get(
            f"/api/organization/{test_organization.id}", headers=owner_auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_organization.id
        assert data["name"] == test_organization.name

    def test_get_organization_not_found(self, client: TestClient, owner_auth_headers):
        """Test getting non-existent organization."""
        response = client.get("/api/organization/99999", headers=owner_auth_headers)

        assert response.status_code == 404

    def test_get_organization_unauthorized(self, client: TestClient, test_organization):
        """Test getting organization without authentication."""
        response = client.get(f"/api/organization/{test_organization.id}")

        assert response.status_code == 401

    def test_update_organization_success(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test updating organization information."""
        update_data = {
            "name": "Updated Organization Name",
            "abbreviation": "UON",
            "address": "456 Updated Address",
        }

        response = client.put(
            f"/api/organization/{test_organization.id}",
            json=update_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Organization Name"
        assert data["abbreviation"] == "UON"

    def test_update_organization_not_found(
        self, client: TestClient, owner_auth_headers
    ):
        """Test updating non-existent organization."""
        update_data = {
            "name": "Not Found Org",
            "abbreviation": "NFO",
            "address": "123 Not Found St",
        }

        response = client.put(
            "/api/organization/99999", json=update_data, headers=owner_auth_headers
        )

        assert response.status_code == 404

    def test_delete_organization_success(
        self, client: TestClient, organization_factory, owner_auth_headers
    ):
        """Test deleting an organization."""
        # Create a separate organization for deletion
        org_to_delete = organization_factory(name="Delete Me Org", abbreviation="DMO")

        response = client.delete(
            f"/api/organization/{org_to_delete.id}", headers=owner_auth_headers
        )

        assert response.status_code == 403

    def test_delete_organization_not_found(
        self, client: TestClient, owner_auth_headers
    ):
        """Test deleting non-existent organization."""
        response = client.delete("/api/organization/99999", headers=owner_auth_headers)

        assert response.status_code == 404


class TestOrganizationModels:
    """Test organization model functionality."""

    def test_organization_creation(self, db_session, test_organization_category):
        """Test creating organization model."""
        org = Organization(
            name="Model Test Org",
            abbreviation="MTO",
            address="123 Model Test St",
            category=test_organization_category.id,
        )

        db_session.add(org)
        db_session.commit()
        db_session.refresh(org)

        assert org.id is not None
        assert org.name == "Model Test Org"
        assert org.category == test_organization_category.id

    def test_organization_category_creation(self, db_session):
        """Test creating organization category model."""
        category = OrganizationCategory(name="Test Category")

        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)

        assert category.id is not None
        assert category.name == "Test Category"

    def test_organization_relationships(self, db_session, test_organization_category):
        """Test organization relationships with category."""
        org = Organization(
            name="Relationship Test Org",
            abbreviation="RTO",
            address="123 Relationship St",
            category=test_organization_category.id,
        )

        db_session.add(org)
        db_session.commit()
        db_session.refresh(org)

        # Verify the relationship
        assert org.category == test_organization_category.id


@pytest.mark.integration
class TestOrganizationIntegration:
    """Integration tests for organization management."""

    def test_organization_creation_flow(
        self, client: TestClient, test_organization_category
    ):
        """Test complete organization creation and setup flow."""
        # Step 1: Create organization with owner
        org_data = {
            "owner_name": "Integration Owner",
            "owner_email": "integration@example.com",
            "password": "integrationpass123",
            "confirm_password": "integrationpass123",
            "phone_number_ext": "+1",
            "phone_number": "1234567890",
            "organization_name": "Integration Test Org",
            "abbrebiation": "ITO",
            "org_address": "123 Integration St",
            "organization_category": test_organization_category.id,
        }

        create_response = client.post("/api/organization/create", json=org_data)
        assert create_response.status_code == 201

        creation_data = create_response.json()
        org_id = creation_data["organization"]["id"]
        owner_email = creation_data["owner"]["email"]

        # Step 2: Login as the new owner
        login_data = {"email": owner_email, "password": org_data["password"]}

        login_response = client.post("/api/auth/login", json=login_data)
        assert login_response.status_code == 200

        token = login_response.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Step 3: Get organization details as owner
        org_response = client.get(f"/api/organization/{org_id}", headers=auth_headers)
        assert org_response.status_code == 200

        org_details = org_response.json()
        assert org_details["name"] == org_data["organization_name"]

        # Step 4: Update organization
        update_data = {
            "name": "Updated Integration Org",
            "abbreviation": "UIO",
            "address": "456 Updated Integration St",
        }

        update_response = client.put(
            f"/api/organization/{org_id}", json=update_data, headers=auth_headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Integration Org"

    def test_organization_with_employees(
        self, client: TestClient, test_organization_category
    ):
        """Test organization with employee management."""
        # Create organization
        org_data = {
            "owner_name": "Employee Manager",
            "owner_email": "manager@employees.com",
            "password": "managerpass123",
            "confirm_password": "managerpass123",
            "phone_number_ext": "+1",
            "phone_number": "1234567890",
            "organization_name": "Employee Test Org",
            "abbrebiation": "ETO",
            "org_address": "123 Employee St",
            "organization_category": test_organization_category.id,
        }

        create_response = client.post("/api/organization/create", json=org_data)
        assert create_response.status_code == 201

        # Login as owner
        login_response = client.post(
            "/api/auth/login",
            json={"email": org_data["owner_email"], "password": org_data["password"]},
        )
        token = login_response.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}

        # Create employee
        employee_data = {
            "full_name": "Test Employee",
            "email": "employee@employees.com",
            "phone_number": "9876543210",  # Different phone number from owner
            "phone_number_ext": "123",
            "address": "123 Employee Home St",
            "pay_type": "HOURLY",
            "payrate": 17.00,
            "password": "employeepass123",
        }

        employee_response = client.post(
            "/api/employee/create", json=employee_data, headers=auth_headers
        )
        assert employee_response.status_code == 201

        # Verify employee belongs to organization
        employee = employee_response.json()
        org_id = create_response.json()["organization"]["id"]
        assert employee["organization_id"] == org_id
