import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/screens/auth';

const Stack = createStackNavigator();

const EmployeeDashboard = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Employee Dashboard</Text>
    <Text style={styles.subText}>
      Employee features will be implemented here
    </Text>
  </View>
);

const EmployerDashboard = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Employer Dashboard</Text>
    <Text style={styles.subText}>
      Employer features will be implemented here
    </Text>
  </View>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : user?.is_owner ? (
          <Stack.Screen
            name="EmployerDashboard"
            component={EmployerDashboard}
          />
        ) : (
          <Stack.Screen
            name="EmployeeDashboard"
            component={EmployeeDashboard}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
