"""Authentication endpoint tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User, PayType
from app.utils.password import get_password_hash, verify_password


class TestAuthEndpoints:
    """Test authentication endpoints."""

    def test_login_success(self, client: TestClient, user_factory, test_organization):
        """Test successful user login."""
        # Create a test user
        test_email = "login@example.com"
        test_password = "testpassword123"

        user = user_factory(email=test_email, password=test_password, is_active=True)

        # Test login
        login_data = {"email": test_email, "password": test_password}

        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()

        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user_id"] == user.id
        assert data["organization_id"] == user.organization_id

    def test_login_user_not_found(self, client: TestClient):
        """Test login with non-existent user."""
        login_data = {"email": "nonexistent@example.com", "password": "password123"}

        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 404
        assert "User not found" in response.json()["detail"]

    def test_login_inactive_user(self, client: TestClient, user_factory):
        """Test login with inactive user."""
        test_email = "inactive@example.com"

        user = user_factory(email=test_email, is_active=False)

        login_data = {"email": test_email, "password": "testpassword123"}

        response = client.post("/api/auth/login", json=login_data)

        assert response.status_code == 404
        assert "Cannot Login" in response.json()["detail"]

    def test_login_missing_email(self, client: TestClient):
        """Test login with missing email."""
        login_data = {"password": "password123"}

        response = client.post("/api/auth/login", json=login_data)

        # This should fail validation
        assert response.status_code == 422

    def test_login_invalid_email_format(self, client: TestClient):
        """Test login with invalid email format."""
        login_data = {"email": "invalid-email", "password": "password123"}

        response = client.post("/api/auth/login", json=login_data)

        # This should fail validation
        assert response.status_code == 422

    def test_get_current_user_success(
        self, client: TestClient, test_user, auth_headers
    ):
        """Test getting current user information."""
        response = client.get("/api/auth/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["id"] == test_user.id
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["is_owner"] == test_user.is_owner
        assert data["is_active"] == test_user.is_active

    def test_get_current_user_no_token(self, client: TestClient):
        """Test getting current user without authentication token."""
        response = client.get("/api/auth/me")

        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient, invalid_token):
        """Test getting current user with invalid token."""
        headers = {"Authorization": f"Bearer {invalid_token}"}
        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 401
        assert "Could not validate credentials" in response.json()["detail"]

    def test_get_current_user_expired_token(self, client: TestClient, expired_token):
        """Test getting current user with expired token."""
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/auth/me", headers=headers)

        assert response.status_code == 401

    def test_contact_email_endpoint(self, client: TestClient):
        """Test contact email endpoint."""
        contact_data = {
            "email": "contact@example.com",
            "name": "Test User",
            "message": "This is a test message",
        }

        response = client.post("/api/auth/contact", json=contact_data)

        # This endpoint should return success/failure status
        assert response.status_code == 200
        data = response.json()
        assert "success" in data

    def test_contact_email_invalid_data(self, client: TestClient):
        """Test contact email with invalid data."""
        contact_data = {"email": "invalid-email", "name": "", "message": ""}

        response = client.post("/api/auth/contact", json=contact_data)

        # Should fail validation
        assert response.status_code == 422


class TestPasswordUtilities:
    """Test password hashing and verification utilities."""

    def test_password_hashing(self):
        """Test password hashing function."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert isinstance(hashed, bytes)
        assert hashed != password.encode()

    def test_password_verification_success(self):
        """Test successful password verification."""
        password = "testpassword123"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_password_verification_failure(self):
        """Test failed password verification."""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = get_password_hash(password)

        assert verify_password(wrong_password, hashed) is False

    def test_password_hashing_different_results(self):
        """Test that same password produces different hashes (salt)."""
        password = "testpassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Hashes should be different due to salt
        assert hash1 != hash2

        # But both should verify correctly
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_authenticate_user_success(self, user_factory):
        """Test successful user authentication."""
        from app.utils.password import authenticate_user

        password = "testauth123"
        user = user_factory(email="auth@example.com", password=password)

        result = authenticate_user(user, password)

        assert result is True

    def test_authenticate_user_wrong_password(self, user_factory):
        """Test user authentication with wrong password."""
        from app.utils.password import authenticate_user

        user = user_factory(email="wrongauth@example.com", password="correctpass")

        result = authenticate_user(user, "wrongpass")

        assert result is False

    def test_authenticate_user_none_user(self):
        """Test user authentication with None user."""
        from app.utils.password import authenticate_user

        result = authenticate_user(None, "anypassword")

        assert result is False


@pytest.mark.integration
class TestAuthIntegration:
    """Integration tests for authentication flow."""

    def test_full_auth_flow(self, client: TestClient, user_factory):
        """Test complete authentication flow: login -> get user info."""
        # Create user
        test_email = "fullflow@example.com"
        test_password = "testpassword123"

        user = user_factory(
            email=test_email,
            password=test_password,
            full_name="Full Flow User",
            is_active=True,
        )

        # Step 1: Login
        login_data = {"email": test_email, "password": test_password}

        login_response = client.post("/api/auth/login", json=login_data)
        assert login_response.status_code == 200

        token = login_response.json()["access_token"]

        # Step 2: Use token to get user info
        headers = {"Authorization": f"Bearer {token}"}
        user_response = client.get("/api/auth/me", headers=headers)

        assert user_response.status_code == 200
        user_data = user_response.json()

        assert user_data["email"] == test_email
        assert user_data["full_name"] == "Full Flow User"
        assert user_data["id"] == user.id
