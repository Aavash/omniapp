"""Global test configuration and fixtures."""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session
from httpx import AsyncClient

from app.main import app
from app.models.base import Base
from app.config.database import get_db
from app.config.env import settings

# Import all fixtures to make them available
from tests.fixtures.auth import *
from tests.fixtures.models import *
from tests.fixtures.database import *

# Test database URL - using SQLite in memory for fast tests
TEST_DATABASE_URL = "sqlite:///:memory:"

# Create test engine with special configuration for SQLite
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    # Create a new session
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        # Drop all tables after each test for clean state
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # Override JWT settings for testing
    original_secret = settings.SECRET_KEY
    settings.SECRET_KEY = "test-secret-key-for-jwt-tokens"

    with TestClient(app) as test_client:
        yield test_client

    # Clean up
    settings.SECRET_KEY = original_secret
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(db_session: Session) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client with database session override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as async_test_client:
        yield async_test_client

    # Clean up
    app.dependency_overrides.clear()
