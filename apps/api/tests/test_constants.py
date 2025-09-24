"""Tests for application constants."""

import pytest
from app.constants import *


class TestConstants:
    """Test application constants are properly defined."""

    def test_constants_exist(self):
        """Test that expected constants are defined."""
        # This test will fail if constants are not properly imported
        # Add specific constant tests based on what's in your constants.py file

        # Example tests - adjust based on your actual constants
        try:
            # Test that constants module can be imported without errors
            import app.constants

            assert app.constants is not None
        except ImportError:
            pytest.fail("Constants module could not be imported")

    def test_constants_are_immutable_types(self):
        """Test that constants use immutable types where appropriate."""
        import app.constants as constants

        # Get all attributes from constants module
        constant_attrs = [attr for attr in dir(constants) if not attr.startswith("_")]

        for attr_name in constant_attrs:
            attr_value = getattr(constants, attr_name)

            # Constants should typically be strings, numbers, tuples, or frozensets
            # Avoid mutable types like lists or dicts for constants
            if isinstance(attr_value, (list, dict, set)):
                pytest.fail(
                    f"Constant {attr_name} uses mutable type {type(attr_value)}"
                )

    def test_constants_naming_convention(self):
        """Test that constants follow proper naming convention (UPPER_CASE)."""
        import app.constants as constants

        constant_attrs = [attr for attr in dir(constants) if not attr.startswith("_")]

        for attr_name in constant_attrs:
            # Skip imported modules or functions
            attr_value = getattr(constants, attr_name)
            if callable(attr_value) or hasattr(attr_value, "__module__"):
                continue

            # Constants should be UPPER_CASE
            if not attr_name.isupper():
                pytest.fail(f"Constant {attr_name} should be UPPER_CASE")

    def test_constants_have_values(self):
        """Test that constants have non-None values."""
        import app.constants as constants

        constant_attrs = [attr for attr in dir(constants) if not attr.startswith("_")]

        for attr_name in constant_attrs:
            attr_value = getattr(constants, attr_name)

            # Skip imported modules or functions
            if callable(attr_value) or hasattr(attr_value, "__module__"):
                continue

            # Constants should have meaningful values
            if attr_value is None:
                pytest.fail(f"Constant {attr_name} should not be None")
