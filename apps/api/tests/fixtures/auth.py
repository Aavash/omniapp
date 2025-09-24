"""Authentication fixtures for testing."""

import pytest
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import jwt

from app.models.user import User, PayType
from app.utils.password import get_password_hash


# Test JWT settings
TEST_SECRET_KEY = "test-secret-key-for-jwt-tokens"
TEST_JWT_ALGORITHM = "HS256"


def create_test_access_token(
    data: Dict[str, Any], expires_delta: timedelta | None = None
) -> str:
    """Create a JWT token for testing purposes."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=24)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, TEST_SECRET_KEY, algorithm=TEST_JWT_ALGORITHM)
    return encoded_jwt


@pytest.fixture
def test_user_data():
    """Basic test user data."""
    return {
        "full_name": "Test User",
        "email": "test@example.com",
        "phone_number": "1234567890",
        "phone_number_ext": "123",
        "address": "123 Test Street, Test City",
        "pay_type": PayType.HOURLY,
        "payrate": 15.50,
        "is_owner": False,
        "is_active": True,
    }


@pytest.fixture
def test_owner_data():
    """Test organization owner data."""
    return {
        "full_name": "Test Owner",
        "email": "owner@example.com",
        "phone_number": "0987654321",
        "phone_number_ext": "456",
        "address": "456 Owner Street, Owner City",
        "pay_type": PayType.MONTHLY,
        "payrate": 5000.00,
        "is_owner": True,
        "is_active": True,
    }


@pytest.fixture
def test_user(db_session, test_user_data, test_organization):
    """Create a test user in the database."""
    password_hash = get_password_hash("testpassword123")

    user = User(
        **test_user_data,
        password_hash=password_hash,
        organization_id=test_organization.id,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_owner(db_session, test_owner_data, test_organization):
    """Create a test organization owner in the database."""
    password_hash = get_password_hash("ownerpassword123")

    owner = User(
        **test_owner_data,
        password_hash=password_hash,
        organization_id=test_organization.id,
    )

    db_session.add(owner)
    db_session.commit()
    db_session.refresh(owner)
    return owner


@pytest.fixture
def test_user_token(test_user):
    """Create a JWT token for the test user."""
    token_data = {
        "email": test_user.email,
        "user_id": test_user.id,
        "is_owner": test_user.is_owner,
    }
    return create_test_access_token(token_data)


@pytest.fixture
def test_owner_token(test_owner):
    """Create a JWT token for the test owner."""
    token_data = {
        "email": test_owner.email,
        "user_id": test_owner.id,
        "is_owner": test_owner.is_owner,
    }
    return create_test_access_token(token_data)


@pytest.fixture
def auth_headers(test_user_token):
    """Create authorization headers for API requests."""
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest.fixture
def owner_auth_headers(test_owner_token):
    """Create authorization headers for owner API requests."""
    return {"Authorization": f"Bearer {test_owner_token}"}


@pytest.fixture
def expired_token():
    """Create an expired JWT token for testing."""
    token_data = {"email": "expired@example.com", "user_id": 999, "is_owner": False}
    # Create token that expired 1 hour ago
    expires_delta = timedelta(hours=-1)
    return create_test_access_token(token_data, expires_delta)


@pytest.fixture
def invalid_token():
    """Create an invalid JWT token for testing."""
    return "invalid.jwt.token"


def create_auth_headers(user_or_token) -> dict:
    """Create authorization headers for API requests."""
    if isinstance(user_or_token, str):
        # It's already a token
        token = user_or_token
    else:
        # It's a user object, create a token
        token_data = {
            "email": user_or_token.email,
            "user_id": user_or_token.id,
            "is_owner": user_or_token.is_owner,
        }
        token = create_test_access_token(token_data)

    return {"Authorization": f"Bearer {token}"}
