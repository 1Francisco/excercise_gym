import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Colors from '../src/constants/Colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.dark.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.card,
          },
          headerTintColor: Colors.dark.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Colors.dark.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            presentation: 'modal',
            title: 'Detalle del Ejercicio',
            headerStyle: {
              backgroundColor: Colors.dark.card,
            },
            headerTitleStyle: {
              color: Colors.dark.text,
            },
            headerTintColor: Colors.dark.primary,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
