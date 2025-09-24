# ShiftBay Mobile

A React Native mobile application for the ShiftBay Employee Management System, built with Expo and TypeScript.

## Features

### Employee Features
- **Dashboard**: View upcoming shifts, hours worked, and punch in/out
- **Schedule**: View personal schedule in calendar format with shift details
- **Payslips**: View current and historical payslips with detailed breakdown
- **Profile**: Manage personal information and availability settings
- **Time Tracking**: Punch in/out functionality with location services

### Employer Features
- **Dashboard**: Overview of organization statistics and metrics
- **Employee Management**: View and manage employees
- **Schedule Overview**: Organization-wide schedule management
- **Reports**: Basic analytics and reporting
- **Settings**: Organization configuration

## Technical Stack

- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform for React Native
- **TypeScript**: Type-safe JavaScript
- **React Navigation**: Navigation library for screens and tabs
- **React Native Paper**: Material Design UI components
- **Axios**: HTTP client for API calls
- **Expo Secure Store**: Secure storage for authentication tokens
- **React Native Calendars**: Calendar component for schedule views
- **TanStack Query**: Data fetching and caching

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── shared/         # Shared UI components
│   ├── employee/       # Employee-specific components
│   └── employer/       # Employer-specific components
├── contexts/           # React contexts (Auth, Theme)
├── hooks/              # Custom React hooks
├── navigation/         # Navigation configuration
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   ├── employee/      # Employee-specific screens
│   └── employer/      # Employer-specific screens
├── services/          # API service functions
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and configuration
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Backend API running on `http://localhost:8000`

### Installation

1. Clone the repository
2. Navigate to the ems-mobile directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the App

1. Start the development server:
   ```bash
   npm start
   ```

2. Use one of the following options to run the app:
   - **iOS Simulator**: Press `i` in the terminal or scan QR code with Expo Go app
   - **Android Emulator**: Press `a` in the terminal or scan QR code with Expo Go app
   - **Physical Device**: Install Expo Go app and scan the QR code

### Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

## Configuration

Update the API base URL in `src/utils/config.ts` if your backend is running on a different host.

## API Integration

The mobile app integrates with the ShiftBay backend API with the following endpoints:

- **Authentication**: `/api/auth/login`, `/api/auth/me`
- **Employee**: `/api/employee/*` (dashboard, schedule, payslips, punches, availability)
- **Employer**: `/api/employer/*` (dashboard, employees, schedules, reports)

## Authentication

The app uses JWT token-based authentication with secure storage:
- Tokens are stored using Expo Secure Store
- Automatic token refresh on API calls
- Secure logout with token cleanup

## Development Notes

### Employee vs Employer Flow
The app automatically determines user role based on the `is_owner` and `is_employee` fields from the backend and shows appropriate navigation.

### State Management
- Authentication state managed via React Context
- API data fetching with TanStack Query for caching and synchronization
- Local state for UI components

### Styling
- Material Design components via React Native Paper
- Custom styling with React Native StyleSheet
- Consistent color scheme and typography

## Testing

The app includes comprehensive testing setup:
- Unit tests with Jest
- Component tests with React Native Testing Library
- API service tests with mock responses
- Coverage reporting and CI integration

## Building for Production

```bash
# Build for development
eas build --profile development

# Build for preview/staging
eas build --profile preview

# Build for production
eas build --profile production
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both iOS and Android
5. Submit a pull request

## License

This project is part of the ShiftBay Employee Management System.