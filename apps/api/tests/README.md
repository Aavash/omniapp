# EMS Backend Test Suite

This directory contains the comprehensive test suite for the Employee Management System backend API.

## Test Structure

```
tests/
├── conftest.py              # Global fixtures and configuration
├── test_auth.py            # Authentication endpoint tests
├── test_basic.py           # Basic setup and infrastructure tests
├── fixtures/
│   ├── auth.py            # Authentication fixtures
│   ├── database.py        # Database fixtures
│   └── models.py          # Model factory fixtures
└── utils/
    └── (future test utilities)
```

## Running Tests

### Quick Start

```bash
# Run all tests with coverage
uv run python -m pytest

# Run specific test file
uv run python -m pytest tests/test_auth.py

# Run with verbose output
uv run python -m pytest -v

# Run only fast tests (exclude slow/integration tests)
uv run python -m pytest -m "not slow and not integration"
```

### Using the Test Script

We provide a convenient test script with various options:

```bash
# Run full test suite
./scripts/test.sh

# Run only fast tests
./scripts/test.sh --fast

# Run only linting
./scripts/test.sh --lint

# Run with verbose output
./scripts/test.sh --verbose

# Show help
./scripts/test.sh --help
```

## Test Categories

Tests are organized into categories using pytest markers:

- **Unit tests**: Fast tests that don't require external dependencies
- **Integration tests**: Tests that involve database or API interactions
- **Slow tests**: Tests that take longer to run (marked with `@pytest.mark.slow`)

## Fixtures

### Database Fixtures

- `db_session`: Provides a clean database session for each test
- `test_organization`: Creates a test organization
- `test_organization_category`: Creates a test organization category

### Authentication Fixtures

- `test_user`: Creates a test user with default settings
- `test_owner`: Creates a test organization owner
- `test_user_token`: JWT token for test user
- `test_owner_token`: JWT token for test owner
- `auth_headers`: Authorization headers for API requests

### Factory Fixtures

- `user_factory`: Factory function for creating test users
- `organization_factory`: Factory function for creating test organizations
- `availability_factory`: Factory function for creating user availability

## Configuration

### Test Database

Tests use SQLite in-memory database by default for speed. The configuration is in `conftest.py`:

```python
TEST_DATABASE_URL = "sqlite:///:memory:"
```

### Environment Variables

Test environment variables are defined in `tests/.env.test`:

```
DATABASE_URL=sqlite:///:memory:
SECRET_KEY=test-secret-key-for-jwt-tokens
TESTING=true
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### Coverage Configuration

Coverage settings are in `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["app"]
omit = [
    "*/tests/*",
    "*/migrations/*",
    "*/__pycache__/*",
]
```

## Writing Tests

### Basic Test Structure

```python
class TestMyFeature:
    """Test my feature functionality."""

    def test_basic_functionality(self, client, test_user):
        """Test basic functionality."""
        response = client.get("/api/my-endpoint")
        assert response.status_code == 200

    @pytest.mark.integration
    def test_database_integration(self, db_session, user_factory):
        """Test database integration."""
        user = user_factory(email="test@example.com")
        assert user.id is not None
```

### Using Factories

```python
def test_user_creation(self, user_factory):
    """Test user creation with factory."""
    user = user_factory(
        email="custom@example.com",
        full_name="Custom User",
        pay_type=PayType.HOURLY,
        payrate=20.00
    )
    assert user.email == "custom@example.com"
```

### API Testing

```python
def test_api_endpoint(self, client, auth_headers):
    """Test API endpoint with authentication."""
    response = client.get(
        "/api/protected-endpoint",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "expected_field" in data
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The workflow includes:

- Code linting with ruff
- Full test suite execution
- Coverage reporting
- Artifact uploads

### Pre-commit Hooks

Install pre-commit hooks to run tests before commits:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Install hooks
pre-commit install

# Run hooks manually
pre-commit run --all-files
```

## Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Shows coverage summary in terminal
- **HTML**: Detailed report in `htmlcov/index.html`
- **XML**: Machine-readable format for CI/CD integration

View HTML coverage report:

```bash
# After running tests with coverage
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure you're running tests with `uv run` to use the correct environment
2. **Database errors**: Tests use in-memory SQLite, so database state is clean for each test
3. **Fixture not found**: Check that fixtures are imported in `conftest.py`

### Debug Mode

Run tests with more verbose output:

```bash
uv run python -m pytest -v -s --tb=long
```

### Running Single Test

```bash
uv run python -m pytest tests/test_auth.py::TestAuthEndpoints::test_login_success -v
```
