"""
Comprehensive tests for employee routes.
"""

from fastapi.testclient import TestClient


class TestEmployeeRoutes:
    """Test employee API routes."""

    def test_create_employee_success(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test creating employee successfully."""
        employee_data = {
            "full_name": "John Employee",
            "email": "john.employee@test.com",
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 Employee St",
            "pay_type": "HOURLY",
            "payrate": 25.0,
            "password": "password123",
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == "John Employee"
        assert data["email"] == "john.employee@test.com"
        assert data["pay_type"] == "HOURLY"

    def test_create_employee_unauthorized(self, client: TestClient):
        """Test creating employee without authentication."""
        employee_data = {
            "full_name": "John Employee",
            "email": "john.employee@test.com",
            "phone_number": "1234567890",
            "pay_type": "HOURLY",
            "payrate": 25.0,
        }

        response = client.post("/api/employee/create", json=employee_data)
        assert response.status_code == 401

    def test_create_employee_duplicate_email(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test creating employee with duplicate email."""
        # Create existing employee
        user_factory(organization_id=test_organization.id, email="existing@test.com")

        employee_data = {
            "full_name": "Duplicate Employee",
            "email": "existing@test.com",  # Duplicate
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 Duplicate St",
            "pay_type": "HOURLY",
            "payrate": 20.0,
            "password": "password123",
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_get_employee_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test getting employee details successfully."""
        employee = user_factory(
            organization_id=test_organization.id,
            full_name="Test Employee",
            email="test.employee@test.com",
        )

        response = client.get(
            f"/api/employee/{employee.id}",
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == employee.id
        assert data["full_name"] == "Test Employee"

    def test_get_employee_not_found(self, client: TestClient, owner_auth_headers):
        """Test getting non-existent employee."""
        response = client.get(
            "/api/employee/99999",
            headers=owner_auth_headers,
        )

        assert response.status_code == 404

    def test_get_employee_cross_organization(
        self, client: TestClient, organization_factory, user_factory, owner_auth_headers
    ):
        """Test getting employee from different organization."""
        other_org = organization_factory(name="Other Org")
        other_employee = user_factory(organization_id=other_org.id)

        response = client.get(
            f"/api/employee/{other_employee.id}",
            headers=owner_auth_headers,
        )

        # Should not be able to access employee from different org
        assert response.status_code in [403, 404]

    def test_update_employee_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test updating employee successfully."""
        employee = user_factory(
            organization_id=test_organization.id,
            full_name="Original Name",
            payrate=20.0,
        )

        update_data = {
            "full_name": "Updated Name",
            "payrate": 25.0,
            "is_active": True,
        }

        response = client.put(
            f"/api/employee/{employee.id}",
            json=update_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Name"
        assert data["payrate"] == 25.0

    def test_update_employee_not_found(self, client: TestClient, owner_auth_headers):
        """Test updating non-existent employee."""
        update_data = {
            "full_name": "Updated Name",
        }

        response = client.put(
            "/api/employee/99999",
            json=update_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 404

    def test_delete_employee_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test deleting employee successfully."""
        employee = user_factory(organization_id=test_organization.id)

        response = client.delete(
            f"/api/employee/{employee.id}",
            headers=owner_auth_headers,
        )

        assert response.status_code == 200

        # Verify employee is soft deleted
        get_response = client.get(
            f"/api/employee/{employee.id}",
            headers=owner_auth_headers,
        )
        assert get_response.status_code == 404

    def test_list_employees_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test listing employees successfully."""
        # Create multiple employees
        employees = []
        for i in range(3):
            employee = user_factory(
                organization_id=test_organization.id,
                full_name=f"Employee {i}",
                email=f"employee{i}@test.com",
            )
            employees.append(employee)

        response = client.get(
            "/api/employee/list",
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 3  # At least our created employees

    def test_list_employees_with_pagination(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test listing employees with pagination."""
        # Create multiple employees
        for i in range(10):
            user_factory(
                organization_id=test_organization.id,
                email=f"emp{i}@test.com",
            )

        response = client.get(
            "/api/employee/list?page=1&per_page=5",
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5

    def test_list_employees_with_search(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test listing employees with search."""
        # Create employees with specific names
        user_factory(
            organization_id=test_organization.id,
            full_name="John Smith",
            email="john@test.com",
        )
        user_factory(
            organization_id=test_organization.id,
            full_name="Jane Doe",
            email="jane@test.com",
        )

        response = client.get(
            "/api/employee/list?search=John",
            headers=owner_auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        # Should find John Smith
        john_found = any(emp["full_name"] == "John Smith" for emp in data)
        assert john_found

    def test_employee_availability_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test getting employee availability."""
        employee = user_factory(organization_id=test_organization.id)

        response = client.get(
            f"/api/employee/{employee.id}/availability",
            headers=owner_auth_headers,
        )

        # Should return availability data (might be empty)
        assert response.status_code == 200

    def test_employee_schedule_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test getting employee schedule."""
        employee = user_factory(organization_id=test_organization.id)

        response = client.get(
            f"/api/employee/{employee.id}/schedule",
            headers=owner_auth_headers,
        )

        # Should return schedule data (might be empty)
        assert response.status_code == 200

    def test_employee_timesheet_success(
        self, client: TestClient, test_organization, owner_auth_headers, user_factory
    ):
        """Test getting employee timesheet."""
        employee = user_factory(organization_id=test_organization.id)

        response = client.get(
            f"/api/employee/{employee.id}/timesheet",
            headers=owner_auth_headers,
        )

        # Should return timesheet data (might be empty)
        assert response.status_code == 200


class TestEmployeeValidation:
    """Test employee data validation."""

    def test_create_employee_invalid_email(
        self, client: TestClient, owner_auth_headers
    ):
        """Test creating employee with invalid email."""
        employee_data = {
            "full_name": "Test Employee",
            "email": "invalid-email",  # Invalid format
            "phone_number": "1234567890",
            "pay_type": "HOURLY",
            "payrate": 20.0,
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 422

    def test_create_employee_invalid_pay_type(
        self, client: TestClient, owner_auth_headers
    ):
        """Test creating employee with invalid pay type."""
        employee_data = {
            "full_name": "Test Employee",
            "email": "test@test.com",
            "phone_number": "1234567890",
            "pay_type": "INVALID_TYPE",  # Invalid
            "payrate": 20.0,
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 422

    def test_create_employee_negative_rate(
        self, client: TestClient, owner_auth_headers
    ):
        """Test creating employee with negative hourly rate."""
        employee_data = {
            "full_name": "Test Employee",
            "email": "test@test.com",
            "phone_number": "1234567890",
            "pay_type": "HOURLY",
            "payrate": -5.0,  # Negative rate
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 422

    def test_create_employee_missing_required_fields(
        self, client: TestClient, owner_auth_headers
    ):
        """Test creating employee with missing required fields."""
        employee_data = {
            "full_name": "Test Employee",
            # Missing email, phone, pay_type, etc.
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert response.status_code == 422


class TestEmployeePermissions:
    """Test employee route permissions."""

    def test_employee_access_as_regular_employee(
        self, client: TestClient, test_organization, user_factory
    ):
        """Test employee access with regular employee permissions."""
        # Create regular employee (not owner)
        regular_employee = user_factory(
            organization_id=test_organization.id,
            is_owner=False,
        )

        # Create auth headers for regular employee
        from tests.fixtures.auth import create_auth_headers

        employee_headers = create_auth_headers(regular_employee)

        # Regular employee should not be able to create other employees
        employee_data = {
            "full_name": "New Employee",
            "email": "new@test.com",
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 New St",
            "pay_type": "HOURLY",
            "payrate": 20.0,
            "password": "password123",
        }

        response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=employee_headers,
        )

        # Should be forbidden for regular employees
        assert response.status_code in [403, 401]

    def test_employee_can_view_own_data(
        self, client: TestClient, test_organization, user_factory
    ):
        """Test that employee can view their own data."""
        employee = user_factory(
            organization_id=test_organization.id,
            is_owner=False,
        )

        from tests.fixtures.auth import create_auth_headers

        employee_headers = create_auth_headers(employee)

        response = client.get(
            f"/api/employee/{employee.id}",
            headers=employee_headers,
        )

        # Employee should be able to view their own data
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == employee.id

    def test_employee_cannot_view_others_data(
        self, client: TestClient, test_organization, user_factory
    ):
        """Test that employee cannot view other employees' data."""
        employee1 = user_factory(
            organization_id=test_organization.id,
            is_owner=False,
        )
        employee2 = user_factory(
            organization_id=test_organization.id,
            is_owner=False,
        )

        from tests.fixtures.auth import create_auth_headers

        employee1_headers = create_auth_headers(employee1)

        response = client.get(
            f"/api/employee/{employee2.id}",
            headers=employee1_headers,
        )

        # Should not be able to view other employee's data
        assert response.status_code in [403, 404]


class TestEmployeeIntegration:
    """Integration tests for employee functionality."""

    def test_complete_employee_lifecycle(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test complete employee lifecycle from creation to deletion."""
        # Step 1: Create employee
        employee_data = {
            "full_name": "Lifecycle Employee",
            "email": "lifecycle@test.com",
            "phone_number": "1234567890",
            "phone_number_ext": "123",
            "address": "123 Lifecycle St",
            "pay_type": "HOURLY",
            "payrate": 22.50,
            "password": "password123",
        }

        create_response = client.post(
            "/api/employee/create",
            json=employee_data,
            headers=owner_auth_headers,
        )

        assert create_response.status_code == 201
        employee_id = create_response.json()["id"]

        # Step 2: Get employee details
        get_response = client.get(
            f"/api/employee/{employee_id}",
            headers=owner_auth_headers,
        )

        assert get_response.status_code == 200
        assert get_response.json()["full_name"] == "Lifecycle Employee"

        # Step 3: Update employee
        update_data = {
            "full_name": "Updated Lifecycle Employee",
            "payrate": 25.0,
        }

        update_response = client.put(
            f"/api/employee/{employee_id}",
            json=update_data,
            headers=owner_auth_headers,
        )

        assert update_response.status_code == 200
        assert update_response.json()["full_name"] == "Updated Lifecycle Employee"
        assert update_response.json()["payrate"] == 25.0

        # Step 4: Verify employee appears in list
        list_response = client.get(
            "/api/employee/list",
            headers=owner_auth_headers,
        )

        assert list_response.status_code == 200
        employees = list_response.json()
        employee_found = any(emp["id"] == employee_id for emp in employees)
        assert employee_found

        # Step 5: Delete employee
        delete_response = client.delete(
            f"/api/employee/{employee_id}",
            headers=owner_auth_headers,
        )

        assert delete_response.status_code == 200

        # Step 6: Verify employee is no longer accessible
        final_get_response = client.get(
            f"/api/employee/{employee_id}",
            headers=owner_auth_headers,
        )

        assert final_get_response.status_code == 404

    def test_employee_with_different_pay_types(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test creating employees with different pay types."""
        pay_types = [
            {"type": "HOURLY", "payrate": 20.0},
            {"type": "MONTHLY", "payrate": 4000.0},
        ]

        created_employees = []

        for i, pay_config in enumerate(pay_types):
            employee_data = {
                "full_name": f"Employee {pay_config['type']}",
                "email": f"employee_{pay_config['type'].lower()}@test.com",
                "phone_number": f"123456789{i}",
                "phone_number_ext": "123",
                "address": f"123 {pay_config['type']} St",
                "pay_type": pay_config["type"],
                "payrate": pay_config["payrate"],
                "password": "password123",
            }

            response = client.post(
                "/api/employee/create",
                json=employee_data,
                headers=owner_auth_headers,
            )

            assert response.status_code == 201
            created_employees.append(response.json())

        # Verify both employees were created with correct pay types
        assert len(created_employees) == 2
        assert created_employees[0]["pay_type"] == "HOURLY"
        assert created_employees[1]["pay_type"] == "MONTHLY"

    def test_employee_bulk_operations(
        self, client: TestClient, test_organization, owner_auth_headers
    ):
        """Test bulk employee operations."""
        # Create multiple employees
        employees = []
        for i in range(5):
            employee_data = {
                "full_name": f"Bulk Employee {i}",
                "email": f"bulk{i}@test.com",
                "phone_number": f"12345678{i:02d}",
                "phone_number_ext": "123",
                "address": f"123 Bulk St {i}",
                "pay_type": "HOURLY",
                "payrate": 20.0 + i,
                "password": "password123",
            }

            response = client.post(
                "/api/employee/create",
                json=employee_data,
                headers=owner_auth_headers,
            )

            assert response.status_code == 201
            employees.append(response.json())

        # Verify all employees appear in list
        list_response = client.get(
            "/api/employee/list",
            headers=owner_auth_headers,
        )

        assert list_response.status_code == 200
        all_employees = list_response.json()

        # Should include our bulk created employees
        bulk_employee_ids = {emp["id"] for emp in employees}
        listed_employee_ids = {emp["id"] for emp in all_employees}

        assert bulk_employee_ids.issubset(listed_employee_ids)

        # Test bulk update (update all to inactive)
        for employee in employees:
            update_response = client.put(
                f"/api/employee/{employee['id']}",
                json={"is_active": False},
                headers=owner_auth_headers,
            )
            assert update_response.status_code == 200
