import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from 'react-error-boundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { configureNotificationHandler } from '../src/services/notifications';
import ErrorFallback from '../src/components/ErrorFallback';

SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { mode, colors } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configureNotificationHandler();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            presentation: 'modal',
            title: 'Detalle del Ejercicio',
          }}
        />
        <Stack.Screen
          name="exercise/create"
          options={{
            presentation: 'modal',
            title: 'Nuevo Ejercicio',
          }}
        />
        <Stack.Screen
          name="routine/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <RootLayoutInner />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
