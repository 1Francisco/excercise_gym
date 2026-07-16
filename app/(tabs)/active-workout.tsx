import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import useWorkoutRunner from '../../src/hooks/useWorkoutRunner';
import ExerciseVisualizer from '../../src/components/ExerciseVisualizer';
import WorkoutTimer from '../../src/components/WorkoutTimer';
import { ChevronRight, ChevronLeft, Play, Pause, Square, Award, Plus, Trash2, Trophy, Bell, BellOff, Zap } from 'lucide-react-native';
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
    isDoNotDisturb,
    toggleDoNotDisturb,
    isGymMode,
    toggleGymMode,
    pauseWorkout,
    resumeWorkout,
    nextStep,
    prevStep,
    skipRest,
    addRestTime,
    endWorkout,
    currentSets,
    addSet,
    updateSet,
    removeSet,
    isPrSet,
    totalVolume,
    warmupExercises,
    cooldownExercises,
  } = useWorkoutRunner();

  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const handleFinishWithCooldown = () => {
    const cooldownText = cooldownExercises
      .map((ex: { name: string; duration: number; reps?: number }) =>
        `• ${ex.name} (${ex.duration}s${ex.reps ? `, ${ex.reps} reps` : ''})`
      )
      .join('\n');

    Alert.alert(
      'Finalizar Entrenamiento',
      `¿Estás seguro?\n\nDespués de finalizar, realiza estos ejercicios de enfriamiento:\n\n${cooldownText}`,
      [
        { text: 'Finalizar', onPress: endWorkout, style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleStopPress = () => {
    Alert.alert(
      '¿Qué deseas hacer?',
      'Puedes pausar el entrenamiento para retomarlo después o finalizarlo por completo.',
      [
        {
          text: 'Solo Pausar',
          onPress: () => {
            if (!isPaused) pauseWorkout();
          },
          style: 'default',
        },
        {
          text: 'Finalizar Entrenamiento',
          onPress: handleFinishWithCooldown,
          style: 'destructive',
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  if (!isActive || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.noWorkoutScrollContent}>
          <View style={styles.noWorkoutTopSection}>
            <Award size={64} color={colors.primary} style={styles.noWorkoutIcon} />
            <Text style={styles.noWorkoutTitle}>¡Empieza a Entrenar!</Text>
            <Text style={styles.noWorkoutSubtitle}>
              No tienes ningún entrenamiento activo en este momento. Ve a la pestaña de "Mis Rutinas" para iniciar una rutina personalizada.
            </Text>
          </View>

          <View style={[styles.warmupSection, isGymMode && styles.warmupSectionProminent]}>
            <Text style={styles.warmupTitle}>¿Calentamiento rápido?</Text>
            <Text style={styles.warmupSubtitle}>Antes de empezar, prueba estos ejercicios:</Text>
            <View style={styles.warmupList}>
              {warmupExercises.map((ex, i) => (
                <View key={i} style={styles.warmupItem}>
                  <Text style={styles.warmupItemName}>{ex.name}</Text>
                  <Text style={styles.warmupItemMeta}>
                    {ex.duration}s{'reps' in ex ? ` · ${ex.reps} reps` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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

  const steps = currentExercise.instruction_steps.es.length > 0
    ? currentExercise.instruction_steps.es
    : currentExercise.instruction_steps.en;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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

        <ExerciseVisualizer
          path={currentExercise.gif_url}
          type="gif"
          priority="high"
          style={styles.gifContainer}
        />

        {/* ─── Sets Tracking ──────────────────────────────── */}
        <View style={styles.trackingSection}>
          <View style={styles.trackingHeader}>
            <Text style={styles.trackingTitle}>Seguimiento</Text>
            {totalVolume > 0 && (
              <Text style={styles.volumeText}>
                Volumen: {totalVolume} kg
              </Text>
            )}
          </View>

          {currentSets.length === 0 && (
            <Text style={styles.noSetsText}>Añade las series que realizarás</Text>
          )}

          {currentSets.map((set) => {
            const pr = isPrSet(set);
            return (
              <View key={set.setNumber} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                <Text style={styles.setNumberLabel}>#{set.setNumber}</Text>

                <View style={styles.setInputGroup}>
                  <Text style={styles.setInputLabel}>Reps</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.reps > 0 ? String(set.reps) : ''}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    onChangeText={(t) => updateSet(set.setNumber, 'reps', parseInt(t) || 0)}
                  />
                </View>

                <View style={styles.setInputGroup}>
                  <Text style={styles.setInputLabel}>Peso (kg)</Text>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight > 0 ? String(set.weight) : ''}
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    onChangeText={(t) => updateSet(set.setNumber, 'weight', parseFloat(t) || 0)}
                  />
                </View>

                <Pressable
                  style={[styles.checkBtn, set.completed && styles.checkBtnDone]}
                  onPress={() => updateSet(set.setNumber, 'completed', !set.completed)}
                >
                  {set.completed && <Text style={styles.checkMark}>✓</Text>}
                </Pressable>

                {pr && (
                  <View style={styles.prBadge}>
                    <Trophy size={12} color={colors.warning} />
                  </View>
                )}

                <Pressable
                  style={styles.removeSetBtn}
                  onPress={() => removeSet(set.setNumber)}
                >
                  <Trash2 size={14} color={colors.accent} />
                </Pressable>
              </View>
            );
          })}

          <Pressable onPress={addSet} style={styles.addSetButton}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addSetText}>Añadir Serie</Text>
          </Pressable>
        </View>

        {/* ─── Instructions ───────────────────────────────── */}
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

      <View style={styles.controlPanel}>
        <View style={styles.navButtonsRow}>
          <Pressable
            onPress={toggleGymMode}
            style={[
              styles.navButton,
              isGymMode ? styles.gymModeActive : styles.gymModeInactive,
              isGymMode && styles.gymModeButton,
            ]}
          >
            <Zap size={20} color={isGymMode ? colors.primary : colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={toggleDoNotDisturb}
            style={[styles.navButton, isDoNotDisturb && styles.dndButtonActive]}
          >
            {isDoNotDisturb ? (
              <BellOff size={20} color={colors.accent} />
            ) : (
              <Bell size={20} color={colors.textMuted} />
            )}
          </Pressable>

          <Pressable
            onPress={prevStep}
            disabled={currentIndex === 0}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          >
            <ChevronLeft size={24} color={currentIndex === 0 ? colors.textMuted : colors.text} />
          </Pressable>

          {isPaused ? (
            <Pressable onPress={resumeWorkout} style={[styles.controlBtn, styles.resumeBtn]}>
              <Play size={20} color={colors.background} fill={colors.background} />
              <Text style={styles.controlBtnText}>Reanudar</Text>
            </Pressable>
          ) : (
            <Pressable onPress={pauseWorkout} style={[styles.controlBtn, styles.pauseBtn]}>
              <Pause size={20} color={colors.text} />
              <Text style={[styles.controlBtnText, { color: colors.text }]}>Pausar</Text>
            </Pressable>
          )}

          <Pressable onPress={handleStopPress} style={styles.navButton}>
            <Square size={20} color={colors.accent} fill={colors.accent} />
          </Pressable>
        </View>

        {!isPaused && (
          <Pressable onPress={nextStep} style={styles.completeButton}>
            <Text style={styles.completeButtonText}>
              {currentIndex === totalExercises - 1 ? 'Finalizar Entrenamiento' : 'Completar Ejercicio'}
            </Text>
            <ChevronRight size={20} color={colors.background} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.dark) {
  const pR = parseInt(colors.primary.slice(1, 3), 16);
  const pG = parseInt(colors.primary.slice(3, 5), 16);
  const pB = parseInt(colors.primary.slice(5, 7), 16);
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    paddingBottom: 180,
  },
  noWorkoutScrollContent: {
    flexGrow: 1,
    paddingTop: 80,
    paddingBottom: 40,
  },
  noWorkoutTopSection: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noWorkoutIcon: {
    marginBottom: 24,
    opacity: 0.8,
  },
  noWorkoutTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
  },
  noWorkoutSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  warmupSection: {
    marginTop: 40,
    paddingHorizontal: 24,
  },
  warmupSectionProminent: {
    marginTop: 48,
  },
  warmupTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  warmupSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  warmupList: {
    gap: 8,
  },
  warmupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  warmupItemName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  warmupItemMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.cardBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  percentageText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  headerSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
  },
  exerciseName: {
    color: colors.text,
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
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
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
    color: colors.text,
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

  // ─── Sets Tracking Styles ─────────────────────────────────

  trackingSection: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  volumeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  noSetsText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  setRowCompleted: {
    opacity: 0.7,
  },
  setNumberLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    width: 28,
  },
  setInputGroup: {
    flex: 1,
  },
  setInputLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  setInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    textAlign: 'center',
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkBtnDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkMark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '800',
  },
  prBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSetBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `rgba(${pR}, ${pG}, ${pB}, 0.3)`,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addSetText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  // ─── Instructions Styles ──────────────────────────────────

  instructionsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  instructionsHeader: {
    color: colors.textMuted,
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
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.15)`,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  stepContentText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },

  // ─── Control Panel Styles ─────────────────────────────────

  controlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#121214',
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dndButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.accent,
  },
  gymModeActive: {
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.15)`,
    borderColor: colors.primary,
  },
  gymModeInactive: {
    opacity: 0.6,
  },
  gymModeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    backgroundColor: colors.primary,
  },
  pauseBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  controlBtnText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  completeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginLeft: 20,
  },
});
}
