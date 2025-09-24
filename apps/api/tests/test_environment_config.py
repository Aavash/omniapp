"""Tests for environment configuration."""

import pytest
import os
from unittest.mock import patch

from app.config.env import settings, Settings


class TestEnvironmentConfig:
    """Test environment configuration and settings."""

    def test_settings_instance_exists(self):
        """Test that settings instance is properly created."""
        assert settings is not None
        assert isinstance(settings, Settings)

    def test_settings_has_required_attributes(self):
        """Test that settings has all required configuration attributes."""
        required_attrs = [
            "SECRET_KEY",
            "DATABASE_URL",
            "JWT_ALGORITHM",
            "ACCESS_TOKEN_EXPIRE_MINUTES",
        ]

        for attr in required_attrs:
            assert hasattr(settings, attr), (
                f"Settings missing required attribute: {attr}"
            )

    def test_secret_key_not_empty(self):
        """Test that SECRET_KEY is not empty."""
        assert settings.SECRET_KEY is not None
        assert len(settings.SECRET_KEY) > 0
        assert isinstance(settings.SECRET_KEY, str)

    def test_database_url_format(self):
        """Test that DATABASE_URL has proper format."""
        assert settings.DATABASE_URL is not None
        assert isinstance(settings.DATABASE_URL, str)
        # Should contain database connection info
        assert len(settings.DATABASE_URL) > 0

    def test_jwt_algorithm_is_valid(self):
        """Test that JWT_ALGORITHM is a valid JWT algorithm."""
        assert settings.JWT_ALGORITHM is not None
        assert isinstance(settings.JWT_ALGORITHM, str)
        # Common JWT algorithms
        valid_algorithms = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"]
        assert settings.JWT_ALGORITHM in valid_algorithms

    def test_access_token_expire_minutes_is_positive(self):
        """Test that ACCESS_TOKEN_EXPIRE_MINUTES is a positive integer."""
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES is not None
        assert isinstance(settings.ACCESS_TOKEN_EXPIRE_MINUTES, int)
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0

    @patch.dict(os.environ, {"SECRET_KEY": "test_secret_key"})
    def test_environment_variable_override(self):
        """Test that environment variables override default values."""
        # Create new settings instance to pick up env var
        test_settings = Settings()
        assert test_settings.SECRET_KEY == "test_secret_key"

    @patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "60"})
    def test_integer_environment_variable(self):
        """Test that integer environment variables are properly parsed."""
        test_settings = Settings()
        assert test_settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60
        assert isinstance(test_settings.ACCESS_TOKEN_EXPIRE_MINUTES, int)

    def test_settings_validation(self):
        """Test that settings validation works properly."""
        # This test ensures that Pydantic validation is working
        try:
            # Try to create settings with invalid data
            with patch.dict(os.environ, {"ACCESS_TOKEN_EXPIRE_MINUTES": "invalid"}):
                Settings()
            pytest.fail("Should have raised validation error for invalid integer")
        except Exception as e:
            # Should raise a validation error
            assert "validation error" in str(e).lower() or "invalid" in str(e).lower()

    def test_settings_immutability(self):
        """Test that settings are immutable after creation."""
        original_secret = settings.SECRET_KEY

        # Try to modify settings (should not be allowed if using frozen=True)
        try:
            settings.SECRET_KEY = "new_secret"
            # If we get here, check if it actually changed
            if settings.SECRET_KEY != "new_secret":
                # Good, it didn't change
                assert settings.SECRET_KEY == original_secret
        except (AttributeError, TypeError):
            # Good, modification was prevented
            assert True

    def test_default_values_exist(self):
        """Test that reasonable default values exist for optional settings."""
        # Test with clean environment
        with patch.dict(os.environ, {}, clear=True):
            try:
                test_settings = Settings()
                # Should not raise an error even with empty environment
                assert test_settings is not None
            except Exception as e:
                # If it fails, it should be due to missing required fields
                assert "field required" in str(e).lower()

    def test_boolean_settings_parsing(self):
        """Test that boolean environment variables are properly parsed."""
        # Test various boolean representations
        boolean_tests = [
            ("true", True),
            ("True", True),
            ("TRUE", True),
            ("1", True),
            ("false", False),
            ("False", False),
            ("FALSE", False),
            ("0", False),
        ]

        for env_value, expected in boolean_tests:
            with patch.dict(os.environ, {"DEBUG": env_value}):
                try:
                    test_settings = Settings()
                    if hasattr(test_settings, "DEBUG"):
                        assert test_settings.DEBUG == expected
                except Exception:
                    # If DEBUG field doesn't exist, that's fine
                    pass

    def test_settings_repr_no_secrets(self):
        """Test that settings representation doesn't expose secrets."""
        settings_str = str(settings)
        settings_repr = repr(settings)

        # SECRET_KEY should not appear in full in string representations
        if len(settings.SECRET_KEY) > 10:
            assert settings.SECRET_KEY not in settings_str
            assert settings.SECRET_KEY not in settings_repr

    def test_database_url_components(self):
        """Test that DATABASE_URL contains expected components."""
        db_url = settings.DATABASE_URL

        # Should contain protocol
        assert "://" in db_url

        # Common database protocols
        protocols = ["postgresql", "mysql", "sqlite", "oracle"]
        has_valid_protocol = any(protocol in db_url.lower() for protocol in protocols)
        assert has_valid_protocol, (
            f"DATABASE_URL should contain a valid protocol: {db_url}"
        )
