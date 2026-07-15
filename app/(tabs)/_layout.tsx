import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Dumbbell, ClipboardList, Play, BarChart3, Flame, Sun, Moon } from 'lucide-react-native';
import { Pressable } from 'react-native';
import { configureNotificationHandler } from '../../src/services/notifications';

export default function TabsLayout() {
  const { colors, mode, toggle } = useTheme();

  useEffect(() => {
    configureNotificationHandler();
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomColor: colors.cardBorder,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        sceneStyle: {
          backgroundColor: colors.background,
        },
        headerRight: () => (
          <Pressable onPress={toggle} style={{ marginRight: 16, padding: 4 }}>
            {mode === 'dark' ? (
              <Sun size={20} color={colors.textMuted} />
            ) : (
              <Moon size={20} color={colors.textMuted} />
            )}
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ejercicios',
          headerTitle: 'Catálogo de Ejercicios',
          tabBarIcon: ({ color, size }) => (
            <Dumbbell color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Mis Rutinas',
          headerTitle: 'Rutinas Personalizadas',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="active-workout"
        options={{
          title: 'Entrenar',
          headerTitle: 'Entrenamiento en Vivo',
          tabBarIcon: ({ color, size }) => (
            <Play color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          headerTitle: 'Historial y Progreso',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          headerTitle: 'Calculadora Nutricional',
          tabBarIcon: ({ color, size }) => (
            <Flame color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
