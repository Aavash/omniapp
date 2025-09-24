# ShiftBay Employee Management System

A comprehensive employee management system designed for shift-based businesses, providing tools for scheduling, time tracking, payroll management, and employee coordination across multiple platforms.

## 🏗️ Monorepo Structure

```
├── apps/
│   ├── api/              # FastAPI backend service
│   ├── web/              # React web application
│   └── app/              # React Native mobile app
├── .github/workflows/    # CI/CD pipelines
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Python 3.13+ and uv
- PostgreSQL 15+
- Docker (optional)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/shiftbay-monorepo.git
cd shiftbay-monorepo

# Install all dependencies
npm install

# Set up API
cd apps/api
cp .env.example .env  # Configure your environment
uv sync
alembic upgrade head

# Set up web
cd ../web
npm install

# Set up app
cd ../app
npm install
```

### Development

```bash
# Start all services in development mode
npm run dev

# Or start individual services
npm run api:dev        # API server
npm run web:dev        # Web application
npm run app:start      # Mobile app (Expo)
```

## 🧪 Testing

```bash
# Run all tests locally
npm test

# Run all tests in Docker (recommended)
npm run test:docker

# Run tests for specific packages
npm run api:test          # Local testing
npm run api:test:docker   # Docker testing
npm run web:test:docker   # Docker testing
npm run app:test:docker   # Docker testing
```

## 🏗️ Build & Deploy

```bash
# Build all packages
npm run build

# Build specific packages
npm run web:build
```

## 📦 Packages

### API (`apps/api`)

- **Framework**: FastAPI with Python 3.13+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with Argon2 hashing
- **Testing**: pytest with coverage reporting

### Web (`apps/web`)

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI**: Radix UI components with Tailwind CSS
- **State Management**: TanStack Query

### App (`apps/app`)

- **Framework**: React Native with Expo SDK 53
- **Navigation**: React Navigation
- **UI**: React Native Paper (Material Design)
- **State Management**: TanStack Query + React Context

## 🔄 CI/CD

The project uses GitHub Actions for continuous integration and deployment:

- **Automated Testing**: Runs tests for all packages on PR/push
- **Code Quality**: Linting, formatting, and type checking
- **Security Scanning**: Vulnerability scanning with Trivy
- **Smart Builds**: Only builds/tests changed packages
- **Deployment**: Automated deployment to staging/production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in this repository
- Check the [documentation](docs/)
- Contact the development team
