import { MD3LightTheme } from 'react-native-paper';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1976d2',
    primaryContainer: '#e3f2fd',
    secondary: '#424242',
    secondaryContainer: '#f5f5f5',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    background: '#fafafa',
    error: '#d32f2f',
    errorContainer: '#ffebee',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#212121',
    onBackground: '#212121',
    onError: '#ffffff',
  },
};

export type AppTheme = typeof theme;
