import Constants from 'expo-constants';

export interface AppConfig {
  API_BASE_URL: string;
  APP_VERSION: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
  ENABLE_FLIPPER: boolean;
}

const getEnvironment = (): AppConfig['ENVIRONMENT'] => {
  if (__DEV__) return 'development';
  if (Constants.expoConfig?.extra?.environment === 'staging') return 'staging';
  return 'production';
};

const getApiBaseUrl = (): string => {
  const env = getEnvironment();
  
  switch (env) {
    case 'development':
      return 'http://localhost:8000/api';
    case 'staging':
      return 'https://staging-api.shiftbay.com/api';
    case 'production':
      return 'https://api.shiftbay.com/api';
    default:
      return 'http://localhost:8000/api';
  }
};

export const config: AppConfig = {
  API_BASE_URL: getApiBaseUrl(),
  APP_VERSION: Constants.expoConfig?.version || '1.0.0',
  ENVIRONMENT: getEnvironment(),
  ENABLE_FLIPPER: __DEV__,
};

export default config;