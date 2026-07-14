import { Tabs } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { Dumbbell, ClipboardList, Play, Flame } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.primary,
        tabBarInactiveTintColor: Colors.dark.tabIconDefault,
        tabBarStyle: {
          backgroundColor: Colors.dark.card,
          borderTopColor: Colors.dark.cardBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: Colors.dark.card,
          borderBottomColor: Colors.dark.cardBorder,
          borderBottomWidth: 1,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
        sceneStyle: {
          backgroundColor: Colors.dark.background,
        },
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
