"""Exception handling tests."""

import pytest
from fastapi import HTTPException

from app.exceptions import CustomHTTPException


class TestCustomExceptions:
    """Test custom exception classes."""

    def test_custom_http_exception(self):
        """Test CustomHTTPException creation and properties."""
        status_code = 400
        detail = "Custom error message"

        exception = CustomHTTPException(status_code=status_code, detail=detail)

        assert isinstance(exception, HTTPException)
        assert exception.status_code == status_code
        assert exception.detail == detail

    def test_custom_http_exception_inheritance(self):
        """Test that CustomHTTPException properly inherits from HTTPException."""
        exception = CustomHTTPException(status_code=500, detail="Server error")

        # Should be instance of both custom and base exception
        assert isinstance(exception, CustomHTTPException)
        assert isinstance(exception, HTTPException)

        # Should have all HTTPException attributes
        assert hasattr(exception, "status_code")
        assert hasattr(exception, "detail")
        assert hasattr(exception, "headers")
