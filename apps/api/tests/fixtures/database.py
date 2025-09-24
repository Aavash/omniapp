"""Database fixtures for testing."""

import pytest
from typing import Generator
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool

from app.models.base import Base

# Test database configuration
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="session")
def test_engine():
    """Create a test database engine."""
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,  # Set to True for SQL debugging
    )
    return engine


@pytest.fixture(scope="session")
def test_session_factory(test_engine):
    """Create a session factory for tests."""
    return sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_transaction(test_engine, test_session_factory) -> Generator[Session, None, None]:
    """
    Create a database transaction that will be rolled back after each test.
    This provides test isolation while being faster than recreating the database.
    """
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    # Create a connection and transaction
    connection = test_engine.connect()
    transaction = connection.begin()

    # Create a session bound to the connection
    session = test_session_factory(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture(scope="function")
def clean_db(test_engine) -> Generator[None, None, None]:
    """
    Ensure a completely clean database state.
    Use this for tests that need a fresh database without any existing data.
    """
    # Drop all tables
    Base.metadata.drop_all(bind=test_engine)
    # Recreate all tables
    Base.metadata.create_all(bind=test_engine)

    yield

    # Clean up after test
    Base.metadata.drop_all(bind=test_engine)
