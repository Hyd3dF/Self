import React from 'react';
import { StatusBar, ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import ECommerceTabs from './src/navigation/ECommerceTabs';
import ProductDetailScreen from './src/screens/ecommerce/ProductDetailScreen';
import SignalDetailScreen from './src/screens/ecommerce/SignalDetailScreen';
import { colors } from './src/theme/colors';
import * as Notifications from 'expo-notifications';

// Configure notifications to show even when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

// Main entry point

// Vantage Premium Theme
const VantageTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'fade',
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);



const MainStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: colors.background },
      animation: 'fade',
    }}
  >
    <Stack.Screen name="Main" component={ECommerceTabs} />
    <Stack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="SignalDetail"
      component={SignalDetailScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);

const Navigation = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={VantageTheme}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      {isAuthenticated ? (
        <MainStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider style={{ backgroundColor: colors.background }}>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
