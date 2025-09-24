#!/bin/bash

# Development setup script for ShiftBay monorepo

set -e

echo "🚀 Setting up ShiftBay development environment..."

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "📋 Checking prerequisites..."
check_command node
check_command npm
check_command python3
check_command uv
check_command docker

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Setup API
echo "🐍 Setting up API..."
cd apps/api
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cat > .env << EOF
DATABASE_URL=postgresql://shiftbay:shiftbay123@localhost:5432/shiftbay
SECRET_KEY=your-development-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=development
EOF
fi

uv sync
cd ../..

# Setup web
echo "⚛️ Setting up web..."
cd apps/web
npm install
cd ../..

# Setup app
echo "📱 Setting up app..."
cd apps/app
npm install
cd ../..

# Start database
echo "🗄️ Starting PostgreSQL database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations
echo "🔄 Running database migrations..."
cd apps/api
uv run alembic upgrade head
cd ../..

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Start all services: npm run dev"
echo "  2. Or start individual services:"
echo "     - API: npm run api:dev"
echo "     - Web: npm run web:dev"
echo "     - App: npm run app:start"
echo ""
echo "🌐 URLs:"
echo "  - API: http://localhost:8000"
echo "  - Web: http://localhost:8080"
echo "  - App: Use Expo Go app with QR code"
echo "  - API Docs: http://localhost:8000/docs"