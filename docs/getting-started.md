# Getting Started

This guide will help you set up the ShiftBay development environment on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **npm** 9+
- **Python** 3.13+ and **uv** package manager
- **PostgreSQL** 15+ (or use Docker)
- **Docker** and **Docker Compose** (optional but recommended)
- **Git**

### Installing Prerequisites

#### Node.js and npm

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

#### Python and uv

```bash
# Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# uv will handle Python installation
```

#### PostgreSQL

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Or use Docker (recommended for development)
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
```

## Quick Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/shiftbay-monorepo.git
   cd shiftbay-monorepo
   ```

2. **Run the setup script**

   ```bash
   npm run setup
   ```

   This script will:

   - Install all dependencies
   - Set up environment files
   - Start the database
   - Run initial migrations

3. **Start development servers**
   ```bash
   npm run dev
   ```

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
uv sync
cd ../..

# Install web dependencies
cd apps/web
npm install
cd ../..

# Install app dependencies
cd apps/app
npm install
cd ../..
```

### 2. Environment Configuration

#### API Environment

Create `apps/api/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/shiftbay
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
```

#### Web Environment

Create `apps/web/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 3. Database Setup

```bash
# Start PostgreSQL (if using Docker)
docker-compose up -d postgres

# Run migrations
cd apps/api
uv run alembic upgrade head
cd ../..
```

### 4. Start Services

```bash
# Start API
npm run api:dev

# Start web (in another terminal)
npm run web:dev

# Start app (in another terminal)
npm run app:start
```

## Verification

After setup, verify everything is working:

1. **API**: Visit [http://localhost:8000/docs](http://localhost:8000/docs)
2. **Web**: Visit [http://localhost:8080](http://localhost:8080)
3. **App**: Scan QR code with Expo Go app

## Testing

Run tests to ensure everything is working correctly:

```bash
# Run all tests locally
npm test

# Run all tests in Docker (recommended for consistency)
npm run test:docker

# Run specific tests in Docker
npm run api:test:docker
npm run web:test:docker
npm run app:test:docker
```

**Docker Testing Benefits:**

- Consistent environment across different machines
- Isolated test database
- No need to install Python/Node.js locally for testing
- Matches CI/CD environment exactly

## Next Steps

- Read the [Architecture Guide](./architecture.md)
- Explore the [API Documentation](./api.md)
- Check out the [Contributing Guidelines](./contributing.md)

## Troubleshooting

### Common Issues

**Port already in use**

```bash
# Kill processes on specific ports
lsof -ti:8000 | xargs kill -9  # API
lsof -ti:8080 | xargs kill -9  # Web
```

**Database connection issues**

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

**Python/uv issues**

```bash
# Reinstall dependencies
cd apps/api
rm -rf .venv
uv sync
```

For more troubleshooting tips, see the [Troubleshooting Guide](./troubleshooting.md).
