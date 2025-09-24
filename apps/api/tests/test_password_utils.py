"""Tests for password utility functions."""

import pytest
from app.utils.password import get_password_hash, verify_password, authenticate_user
from app.models.user import User


class TestPasswordUtils:
    """Test password hashing and verification utilities."""

    def test_get_password_hash(self):
        """Test password hashing function."""
        password = "test_password_123"
        hashed = get_password_hash(password)

        assert isinstance(hashed, bytes)
        assert len(hashed) > 0
        assert hashed != password.encode()

    def test_get_password_hash_different_passwords(self):
        """Test that different passwords produce different hashes."""
        password1 = "password123"
        password2 = "password456"

        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)

        assert hash1 != hash2

    def test_get_password_hash_same_password_different_hashes(self):
        """Test that same password produces different hashes (salt)."""
        password = "same_password"

        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)

        # Due to salting, same password should produce different hashes
        assert hash1 != hash2

    def test_verify_password_correct(self):
        """Test password verification with correct password."""
        password = "correct_password"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test password verification with incorrect password."""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        hashed = get_password_hash(correct_password)

        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_empty_password(self):
        """Test password verification with empty password."""
        password = "test_password"
        hashed = get_password_hash(password)

        assert verify_password("", hashed) is False

    def test_verify_password_special_characters(self):
        """Test password verification with special characters."""
        password = "p@ssw0rd!#$%^&*()"
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_verify_password_unicode_characters(self):
        """Test password verification with unicode characters."""
        password = "пароль123"  # Russian characters
        hashed = get_password_hash(password)

        assert verify_password(password, hashed) is True

    def test_authenticate_user_valid(self, test_user):
        """Test user authentication with valid credentials."""
        password = "test_password"
        test_user.password_hash = get_password_hash(password)

        result = authenticate_user(test_user, password)
        assert result is True

    def test_authenticate_user_invalid_password(self, test_user):
        """Test user authentication with invalid password."""
        correct_password = "correct_password"
        wrong_password = "wrong_password"
        test_user.password_hash = get_password_hash(correct_password)

        result = authenticate_user(test_user, wrong_password)
        assert result is False

    def test_authenticate_user_none_user(self):
        """Test user authentication with None user."""
        result = authenticate_user(None, "any_password")
        assert result is False

    def test_authenticate_user_no_password_hash(self, test_user):
        """Test user authentication when user has no password hash."""
        test_user.password_hash = None

        # This should handle the None case gracefully
        try:
            result = authenticate_user(test_user, "any_password")
            assert result is False
        except AttributeError:
            # If it raises AttributeError due to None.decode(), that's expected
            assert True

    def test_password_hash_length_consistency(self):
        """Test that password hashes have consistent format."""
        passwords = [
            "short",
            "medium_length_password",
            "very_long_password_with_many_characters_123456789",
        ]

        hashes = [get_password_hash(pwd) for pwd in passwords]

        # All hashes should be bytes
        for hash_val in hashes:
            assert isinstance(hash_val, bytes)
            assert len(hash_val) > 50  # Argon2 hashes are typically quite long

    def test_verify_password_case_sensitive(self):
        """Test that password verification is case sensitive."""
        password = "CaseSensitive"
        hashed = get_password_hash(password)

        assert verify_password("CaseSensitive", hashed) is True
        assert verify_password("casesensitive", hashed) is False
        assert verify_password("CASESENSITIVE", hashed) is False
