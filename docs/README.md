# ShiftBay Documentation

Welcome to the ShiftBay Employee Management System documentation.

## 📚 Documentation Structure

- [Getting Started](./getting-started.md) - Quick setup and installation guide
- [Architecture](./architecture.md) - System architecture and design decisions
- [API Documentation](./api.md) - Backend API endpoints and usage
- [Frontend Guide](./frontend.md) - React web application development
- [Mobile Guide](./mobile.md) - React Native mobile app development
- [Deployment](./deployment.md) - Production deployment guide
- [Contributing](./contributing.md) - Development workflow and guidelines

## 🚀 Quick Links

- **API**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Web**: [http://localhost:8080](http://localhost:8080)
- **App**: Use Expo Go app with development server

## 🏗️ Project Structure

```
shiftbay-monorepo/
├── apps/
│   ├── api/              # FastAPI backend
│   ├── web/              # React web app
│   └── app/              # React Native app
├── scripts/              # Development scripts
├── docs/                 # Documentation
└── .github/workflows/    # CI/CD pipelines
```

## 🛠️ Development Commands

```bash
# Setup development environment
npm run setup

# Start all services
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 🤝 Getting Help

- Check the [troubleshooting guide](./troubleshooting.md)
- Review [frequently asked questions](./faq.md)
- Create an issue in the repository
- Contact the development team
