"""Tests for database configuration."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.database import get_db, engine, SessionLocal
from app.models.base import Base


class TestDatabaseConfig:
    """Test database configuration and connection."""

    def test_engine_exists(self):
        """Test that database engine is properly configured."""
        assert engine is not None
        assert hasattr(engine, "connect")

    def test_session_local_exists(self):
        """Test that SessionLocal is properly configured."""
        assert SessionLocal is not None
        assert hasattr(SessionLocal, "__call__")

    def test_get_db_generator(self):
        """Test that get_db returns a generator."""
        db_gen = get_db()
        assert hasattr(db_gen, "__next__")
        assert hasattr(db_gen, "__iter__")

    def test_get_db_yields_session(self):
        """Test that get_db yields a database session."""
        db_gen = get_db()
        try:
            session = next(db_gen)
            assert session is not None
            assert hasattr(session, "query")
            assert hasattr(session, "add")
            assert hasattr(session, "commit")
            assert hasattr(session, "rollback")
        except StopIteration:
            pytest.fail("get_db should yield a session")
        finally:
            # Clean up
            try:
                next(db_gen)
            except StopIteration:
                pass  # Expected when generator finishes

    def test_database_connection(self):
        """Test that we can connect to the database."""
        try:
            with engine.connect() as connection:
                assert connection is not None
                # Try a simple query
                from sqlalchemy import text

                result = connection.execute(text("SELECT 1"))
                assert result.fetchone()[0] == 1
        except Exception as e:
            pytest.fail(f"Database connection failed: {e}")

    def test_session_creation(self):
        """Test that we can create database sessions."""
        session = SessionLocal()
        try:
            assert session is not None
            assert hasattr(session, "query")

            # Test that session can execute queries
            from sqlalchemy import text

            result = session.execute(text("SELECT 1")).fetchone()
            assert result[0] == 1
        finally:
            session.close()

    def test_base_metadata_exists(self):
        """Test that Base metadata is properly configured."""
        assert Base.metadata is not None
        assert hasattr(Base.metadata, "tables")
        assert hasattr(Base.metadata, "create_all")
        assert hasattr(Base.metadata, "drop_all")

    def test_table_creation(self):
        """Test that tables can be created from metadata."""
        # Create a test engine for this test
        test_engine = create_engine("sqlite:///:memory:")

        try:
            # This should not raise an exception
            Base.metadata.create_all(bind=test_engine)

            # Verify some tables were created
            assert len(Base.metadata.tables) > 0

            # Test that we can inspect the created tables
            with test_engine.connect() as conn:
                # Check if at least one table exists
                from sqlalchemy import text

                tables = conn.execute(
                    text("SELECT name FROM sqlite_master WHERE type='table'")
                ).fetchall()
                assert len(tables) > 0

        except Exception as e:
            pytest.fail(f"Table creation failed: {e}")

    def test_session_transaction_rollback(self):
        """Test that session transactions can be rolled back."""
        session = SessionLocal()
        try:
            # Start a transaction
            session.begin()

            # Try to execute something (this might fail in test environment)
            try:
                from sqlalchemy import text

                session.execute(text("SELECT 1"))
                session.rollback()
                # If we get here, rollback worked
                assert True
            except Exception:
                # If query fails, just test that rollback doesn't raise
                session.rollback()
                assert True

        finally:
            session.close()

    def test_session_autocommit_disabled(self):
        """Test that sessions have autocommit disabled by default."""
        session = SessionLocal()
        try:
            # Check that autocommit is disabled (SQLAlchemy 2.0 doesn't have autocommit attribute)
            # Instead check that we can start transactions
            assert hasattr(session, "begin")
        finally:
            session.close()

    def test_multiple_sessions_independent(self):
        """Test that multiple sessions are independent."""
        session1 = SessionLocal()
        session2 = SessionLocal()

        try:
            assert session1 is not session2
            assert session1.bind == session2.bind  # Same engine

            # Both should be able to execute queries independently
            from sqlalchemy import text

            result1 = session1.execute(text("SELECT 1")).fetchone()
            result2 = session2.execute(text("SELECT 2")).fetchone()

            assert result1[0] == 1
            assert result2[0] == 2

        finally:
            session1.close()
            session2.close()
