import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dumbbell, BarChart3, Apple, Zap } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    icon: Dumbbell,
    title: 'Entrena con propósito',
    description: 'Sigue rutinas personalizadas, registra tus series y repeticiones, y mejora cada día.',
    color: '#10b981',
  },
  {
    icon: BarChart3,
    title: 'Sigue tu progreso',
    description: 'Visualiza tu volumen de entrenamiento, racha de días y distribución muscular semanal.',
    color: '#a855f7',
  },
  {
    icon: Apple,
    title: 'Controla tu nutrición',
    description: 'Calcula tus macros, escanea productos, analiza comidas con IA y mantén el control.',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: '¡A darle!',
    description: 'Todo lo que necesitas en una sola app. Empieza ahora y transforma tu cuerpo.',
    color: '#3b82f6',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      AsyncStorage.setItem('@onboarding_complete_v1', 'true');
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    AsyncStorage.setItem('@onboarding_complete_v1', 'true');
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <View style={[styles.iconCircle, { backgroundColor: current.color + '20' }]}>
          <Icon size={64} color={current.color} />
        </View>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && { backgroundColor: current.color, width: 24 }]} />
          ))}
        </View>

        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        <Pressable onPress={handleNext} style={[styles.button, { backgroundColor: current.color }]}>
          <Text style={styles.buttonText}>
            {step === STEPS.length - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </Pressable>

        {step < STEPS.length - 1 && (
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Omitir</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f12',
  },
  topSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27272a',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#a1a1aa',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
});
