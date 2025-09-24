"""Basic tests to verify test setup."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models.user import User, PayType


class TestBasicSetup:
    """Basic tests to verify test infrastructure works."""

    def test_app_exists(self):
        """Test that the FastAPI app exists."""
        assert app is not None

    def test_database_session(self, db_session: Session):
        """Test that database session fixture works."""
        assert db_session is not None

    def test_test_client(self, client: TestClient):
        """Test that test client fixture works."""
        assert client is not None

    def test_api_root_accessible(self, client: TestClient):
        """Test that API is accessible."""
        # This might return 404 if no root endpoint exists, but should not error
        response = client.get("/")
        # Just verify we get a response
        assert response.status_code in [200, 404, 405]

    def test_user_factory(self, user_factory, test_organization):
        """Test that user factory fixture works."""
        user = user_factory(email="factory@example.com", full_name="Factory User")

        assert user.id is not None
        assert user.email == "factory@example.com"
        assert user.full_name == "Factory User"
        assert user.organization_id == test_organization.id

    def test_organization_factory(self, organization_factory):
        """Test that organization factory fixture works."""
        org = organization_factory(name="Test Factory Org", abbreviation="TFO")

        assert org.id is not None
        assert org.name == "Test Factory Org"
        assert org.abbreviation == "TFO"

    def test_model_creation(self, db_session: Session, test_organization):
        """Test direct model creation in database."""
        from app.utils.password import get_password_hash

        user = User(
            full_name="Direct User",
            email="direct@example.com",
            phone_number="1234567890",
            phone_number_ext="123",
            address="123 Direct St",
            password_hash=get_password_hash("password123"),
            pay_type=PayType.HOURLY,
            payrate=15.00,
            organization_id=test_organization.id,
            is_owner=False,
            is_active=True,
        )

        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        assert user.id is not None
        assert user.email == "direct@example.com"
