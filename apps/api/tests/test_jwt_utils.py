"""JWT utility tests."""

import pytest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException
import jwt

from app.utils.jwt import create_access_token, get_current_user
from app.config.env import settings


class TestJWTUtilities:
    """Test JWT utility functions."""

    def test_create_access_token_default_expiry(self):
        """Test creating access token with default expiry."""
        data = {"user_id": 1, "email": "test@example.com"}

        token = create_access_token(data)

        assert isinstance(token, str)
        assert len(token) > 0

        # Decode token to verify contents
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert decoded["user_id"] == 1
        assert decoded["email"] == "test@example.com"
        assert "exp" in decoded

    def test_create_access_token_custom_expiry(self):
        """Test creating access token with custom expiry."""
        data = {"user_id": 2, "email": "custom@example.com"}
        expires_delta = timedelta(hours=1)

        token = create_access_token(data, expires_delta)

        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        # Check expiry is approximately 1 hour from now
        exp_time = datetime.fromtimestamp(decoded["exp"], tz=timezone.utc)
        expected_time = datetime.now(timezone.utc) + expires_delta

        # Allow 10 second tolerance
        assert abs((exp_time - expected_time).total_seconds()) < 10

    def test_create_access_token_with_additional_claims(self):
        """Test creating access token with additional claims."""
        data = {
            "user_id": 3,
            "email": "claims@example.com",
            "is_owner": True,
            "organization_id": 123,
        }

        token = create_access_token(data)

        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert decoded["user_id"] == 3
        assert decoded["email"] == "claims@example.com"
        assert decoded["is_owner"] is True
        assert decoded["organization_id"] == 123

    @pytest.mark.asyncio
    async def test_get_current_user_success(self, db_session, user_factory):
        """Test getting current user from valid token."""
        user = user_factory(email="jwt@example.com")

        # Create token for this user
        token_data = {"user_id": user.id, "email": user.email}
        token = create_access_token(token_data)

        # Mock the dependency injection for database session
        current_user = await get_current_user(token, db_session)

        assert current_user is not None
        assert current_user.id == user.id
        assert current_user.email == user.email

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, db_session):
        """Test getting current user with invalid token."""
        invalid_token = "invalid.jwt.token"

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(invalid_token, db_session)

        assert exc_info.value.status_code == 401
        assert "Could not validate credentials" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_get_current_user_expired_token(self, db_session, user_factory):
        """Test getting current user with expired token."""
        user = user_factory(email="expired@example.com")

        # Create expired token
        token_data = {"user_id": user.id, "email": user.email}
        expired_delta = timedelta(hours=-1)  # 1 hour ago
        expired_token = create_access_token(token_data, expired_delta)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(expired_token, db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_no_email_claim(self, db_session):
        """Test getting current user with token missing email claim."""
        # Create token without email
        token_data = {"user_id": 1}
        token = create_access_token(token_data)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token, db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_nonexistent_user(self, db_session):
        """Test getting current user for non-existent user."""
        # Create token for non-existent user
        token_data = {"user_id": 99999, "email": "nonexistent@example.com"}
        token = create_access_token(token_data)

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(token, db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_wrong_algorithm(self, db_session, user_factory):
        """Test getting current user with token signed with wrong algorithm."""
        user = user_factory(email="wrongalgo@example.com")

        # Create token with wrong algorithm
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        wrong_algo_token = jwt.encode(
            token_data, settings.SECRET_KEY, algorithm="HS512"
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(wrong_algo_token, db_session)

        assert exc_info.value.status_code == 401

    @pytest.mark.asyncio
    async def test_get_current_user_wrong_secret(self, db_session, user_factory):
        """Test getting current user with token signed with wrong secret."""
        user = user_factory(email="wrongsecret@example.com")

        # Create token with wrong secret
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        wrong_secret_token = jwt.encode(
            token_data, "wrong-secret", algorithm=settings.JWT_ALGORITHM
        )

        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(wrong_secret_token, db_session)

        assert exc_info.value.status_code == 401

    def test_token_payload_integrity(self):
        """Test that token payload cannot be tampered with."""
        original_data = {"user_id": 1, "email": "original@example.com"}
        token = create_access_token(original_data)

        # Decode and verify original data
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert decoded["user_id"] == 1
        assert decoded["email"] == "original@example.com"

        # Try to decode with wrong secret (should fail)
        with pytest.raises(jwt.InvalidSignatureError):
            jwt.decode(token, "wrong-secret", algorithms=[settings.JWT_ALGORITHM])

    def test_token_expiry_validation(self):
        """Test token expiry validation."""
        data = {"user_id": 1, "email": "expiry@example.com"}

        # Create token that expires in 1 second
        short_expiry = timedelta(seconds=1)
        token = create_access_token(data, short_expiry)

        # Should be valid immediately
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert decoded["user_id"] == 1

        # Wait for expiry and verify it fails
        import time

        time.sleep(2)

        with pytest.raises(jwt.ExpiredSignatureError):
            jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])

    def test_token_algorithm_validation(self):
        """Test that only specified algorithm is accepted."""
        data = {"user_id": 1, "email": "algo@example.com"}

        # Create token with correct algorithm
        token = create_access_token(data)

        # Should decode successfully with correct algorithm
        decoded = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        assert decoded["user_id"] == 1

        # Should fail with different algorithm list
        with pytest.raises(jwt.InvalidAlgorithmError):
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS512"])


@pytest.mark.integration
class TestJWTIntegration:
    """Integration tests for JWT functionality."""

    @pytest.mark.asyncio
    async def test_full_jwt_flow(self, db_session, user_factory):
        """Test complete JWT flow: create token, validate user, use in request."""
        # Create user
        user = user_factory(
            email="fullflow@example.com", full_name="Full Flow User", is_active=True
        )

        # Create token
        token_data = {
            "user_id": user.id,
            "email": user.email,
            "is_owner": user.is_owner,
        }
        token = create_access_token(token_data)

        # Validate token and get user
        current_user = await get_current_user(token, db_session)

        # Verify user details
        assert current_user.id == user.id
        assert current_user.email == user.email
        assert current_user.full_name == "Full Flow User"
        assert current_user.is_active is True

    def test_token_refresh_scenario(self):
        """Test scenario where tokens need to be refreshed."""
        user_data = {"user_id": 1, "email": "refresh@example.com"}

        # Create short-lived token
        short_token = create_access_token(user_data, timedelta(seconds=1))

        # Create long-lived token (simulating refresh token)
        long_token = create_access_token(user_data, timedelta(hours=24))

        # Both should be valid initially
        short_decoded = jwt.decode(
            short_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        long_decoded = jwt.decode(
            long_token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )

        assert short_decoded["user_id"] == 1
        assert long_decoded["user_id"] == 1

        # Long token should have later expiry
        assert long_decoded["exp"] > short_decoded["exp"]

    @pytest.mark.asyncio
    async def test_concurrent_token_validation(self, db_session, user_factory):
        """Test that multiple tokens for same user work correctly."""
        user = user_factory(email="concurrent@example.com")

        # Create multiple tokens for same user
        token1 = create_access_token({"user_id": user.id, "email": user.email})
        token2 = create_access_token({"user_id": user.id, "email": user.email})

        # Both tokens should validate to same user
        user1 = await get_current_user(token1, db_session)
        user2 = await get_current_user(token2, db_session)

        assert user1.id == user2.id == user.id
        assert user1.email == user2.email == user.email
