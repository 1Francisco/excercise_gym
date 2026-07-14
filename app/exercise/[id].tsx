import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { exercises } from '../../src/hooks/useExerciseFilter';
import ExerciseVisualizer from '../../src/components/ExerciseVisualizer';
import { ArrowLeft, CheckCircle2, Info } from 'lucide-react-native';
import { translateMuscle, translateEquipment, translateExerciseName } from '../../src/constants/Translations';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Find matching exercise
  const exercise = exercises.find((ex) => ex.id === id);

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ejercicio no encontrado.</Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Get instructions in Spanish, fallback to English if not translated
  const steps = exercise.instruction_steps.es.length > 0
    ? exercise.instruction_steps.es
    : exercise.instruction_steps.en;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Visualizer GIF */}
        <ExerciseVisualizer
          path={exercise.gif_url}
          type="gif"
          style={styles.gifContainer}
        />

        {/* Details card */}
        <View style={styles.contentContainer}>
          <Text style={styles.exerciseName}>{translateExerciseName(exercise.name)}</Text>
          
          {/* Metadata Grid */}
          <View style={styles.metadataGrid}>
            <View style={styles.metadataCard}>
              <Text style={styles.metadataLabel}>Zona Principal</Text>
              <Text style={styles.metadataValue}>{translateMuscle(exercise.body_part)}</Text>
            </View>
            <View style={styles.metadataCard}>
              <Text style={styles.metadataLabel}>Equipamiento</Text>
              <Text style={styles.metadataValue}>{translateEquipment(exercise.equipment)}</Text>
            </View>
            <View style={styles.metadataCard}>
              <Text style={styles.metadataLabel}>Músculo Objetivo</Text>
              <Text style={styles.metadataValue}>{translateMuscle(exercise.target)}</Text>
            </View>
            <View style={styles.metadataCard}>
              <Text style={styles.metadataLabel}>Sinergista</Text>
              <Text style={styles.metadataValue}>{translateMuscle(exercise.muscle_group)}</Text>
            </View>
          </View>

          {/* Secondary Muscles */}
          {exercise.secondary_muscles.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Músculos Secundarios</Text>
              <View style={styles.tagRow}>
                {exercise.secondary_muscles.map((muscle) => (
                  <View key={muscle} style={styles.secondaryTag}>
                    <Text style={styles.secondaryTagText}>{translateMuscle(muscle)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Step-by-step Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guía de Ejecución</Text>
            <View style={styles.stepsList}>
              {steps.map((step, index) => (
                <View key={index} style={styles.stepItem}>
                  <CheckCircle2 size={18} color={Colors.dark.primary} style={styles.stepIcon} />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attribution footer */}
          <View style={styles.attributionContainer}>
            <Info size={14} color={Colors.dark.textMuted} />
            <Text style={styles.attributionText}>{exercise.attribution}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: Colors.dark.background,
    fontWeight: '700',
  },
  gifContainer: {
    height: 300,
    width: '100%',
    backgroundColor: '#1c1c1e',
  },
  contentContainer: {
    padding: 20,
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 26,
    fontWeight: '800',
    textTransform: 'capitalize',
    marginBottom: 20,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metadataCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 12,
  },
  metadataLabel: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  secondaryTagText: {
    color: Colors.dark.text,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  stepText: {
    color: Colors.dark.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  attributionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    gap: 6,
  },
  attributionText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    flex: 1,
  },
});
