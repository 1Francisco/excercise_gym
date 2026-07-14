import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  SafeAreaView,
} from 'react-native';
import Colors from '../../src/constants/Colors';
import useWorkoutRunner from '../../src/hooks/useWorkoutRunner';
import ExerciseVisualizer from '../../src/components/ExerciseVisualizer';
import WorkoutTimer from '../../src/components/WorkoutTimer';
import { ChevronRight, ChevronLeft, Play, Pause, Square, Award } from 'lucide-react-native';
import { translateMuscle, translateEquipment, translateExerciseName } from '../../src/constants/Translations';

export default function ActiveWorkoutScreen() {
  const {
    isActive,
    isPaused,
    isResting,
    timeRemaining,
    currentIndex,
    totalExercises,
    currentExercise,
    nextExercise,
    pauseWorkout,
    resumeWorkout,
    nextStep,
    prevStep,
    skipRest,
    addRestTime,
    endWorkout,
  } = useWorkoutRunner();

  // State when no workout is active
  if (!isActive || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noWorkoutContainer}>
          <Award size={64} color={Colors.dark.primary} style={styles.noWorkoutIcon} />
          <Text style={styles.noWorkoutTitle}>¡Empieza a Entrenar!</Text>
          <Text style={styles.noWorkoutSubtitle}>
            No tienes ningún entrenamiento activo en este momento. Ve a la pestaña de "Mis Rutinas" para iniciar una rutina personalizada.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // State when resting between exercises
  if (isResting) {
    return (
      <SafeAreaView style={styles.container}>
        <WorkoutTimer
          timeRemaining={timeRemaining}
          nextExercise={nextExercise}
          onSkip={skipRest}
          onAddSeconds={addRestTime}
        />
      </SafeAreaView>
    );
  }

  // Get instructions in Spanish, fallback to English if not translated
  const steps = currentExercise.instruction_steps.es.length > 0
    ? currentExercise.instruction_steps.es
    : currentExercise.instruction_steps.en;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Workout Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${((currentIndex + 1) / totalExercises) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressText}>
              Ejercicio {currentIndex + 1} de {totalExercises}
            </Text>
            <Text style={styles.percentageText}>
              {Math.round(((currentIndex + 1) / totalExercises) * 100)}%
            </Text>
          </View>
        </View>

        {/* Exercise Header */}
        <View style={styles.headerSection}>
          <Text style={styles.exerciseName}>{translateExerciseName(currentExercise.name)}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.bodyPartBadge}>
              <Text style={styles.badgeText}>{translateMuscle(currentExercise.body_part)}</Text>
            </View>
            <View style={styles.equipmentBadge}>
              <Text style={styles.badgeText}>{translateEquipment(currentExercise.equipment)}</Text>
            </View>
          </View>
        </View>

        {/* Exercise Visual (GIF Animation) */}
        <ExerciseVisualizer
          path={currentExercise.gif_url}
          type="gif"
          style={styles.gifContainer}
        />

        {/* Steps and Instructions */}
        <View style={styles.instructionsSection}>
          <Text style={styles.instructionsHeader}>Instrucciones Paso a Paso</Text>
          <View style={styles.stepsList}>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.stepItem}>
                <View style={styles.stepNumberCircle}>
                  <Text style={styles.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepContentText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Persistent Action Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.navButtonsRow}>
          {/* Back button */}
          <Pressable
            onPress={prevStep}
            disabled={currentIndex === 0}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          >
            <ChevronLeft size={24} color={currentIndex === 0 ? '#52525b' : Colors.dark.text} />
          </Pressable>

          {/* Pause / Resume */}
          {isPaused ? (
            <Pressable onPress={resumeWorkout} style={[styles.controlBtn, styles.resumeBtn]}>
              <Play size={20} color={Colors.dark.background} fill={Colors.dark.background} />
              <Text style={styles.controlBtnText}>Reanudar</Text>
            </Pressable>
          ) : (
            <Pressable onPress={pauseWorkout} style={[styles.controlBtn, styles.pauseBtn]}>
              <Pause size={20} color={Colors.dark.text} />
              <Text style={[styles.controlBtnText, { color: Colors.dark.text }]}>Pausar</Text>
            </Pressable>
          )}

          {/* Stop / Cancel */}
          <Pressable onPress={endWorkout} style={styles.navButton}>
            <Square size={20} color={Colors.dark.accent} fill={Colors.dark.accent} />
          </Pressable>
        </View>

        {/* Next exercise / Complete action */}
        {!isPaused && (
          <Pressable onPress={nextStep} style={styles.completeButton}>
            <Text style={styles.completeButtonText}>
              {currentIndex === totalExercises - 1 ? 'Finalizar Entrenamiento' : 'Completar Ejercicio'}
            </Text>
            <ChevronRight size={20} color={Colors.dark.background} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    paddingBottom: 160, // Ensure space for control panel
  },
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  noWorkoutIcon: {
    marginBottom: 24,
    opacity: 0.8,
  },
  noWorkoutTitle: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  noWorkoutSubtitle: {
    color: Colors.dark.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.dark.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  percentageText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  exerciseName: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bodyPartBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  equipmentBadge: {
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  gifContainer: {
    height: 240,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  instructionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  instructionsHeader: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepContentText: {
    color: Colors.dark.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121214', // Elevated darker background
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    gap: 12,
  },
  navButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  controlBtn: {
    flex: 1,
    marginHorizontal: 16,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resumeBtn: {
    backgroundColor: Colors.dark.primary,
  },
  pauseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  controlBtnText: {
    color: Colors.dark.background,
    fontSize: 15,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: Colors.dark.primary,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  completeButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginLeft: 20, // offset chevron
  },
});
