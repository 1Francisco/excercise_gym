import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Colors from '../constants/Colors';
import { Play, Plus } from 'lucide-react-native';
import { Exercise } from '../types/exercise';
import ExerciseVisualizer from './ExerciseVisualizer';
import { translateMuscle, translateEquipment, translateExerciseName } from '../constants/Translations';
import { useTheme } from '../contexts/ThemeContext';

interface WorkoutTimerProps {
  timeRemaining: number;
  nextExercise: Exercise | null;
  onSkip: () => void;
  onAddSeconds: (seconds: number) => void;
}

export default function WorkoutTimer({ timeRemaining, nextExercise, onSkip, onAddSeconds }: WorkoutTimerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <Text style={styles.restTitle}>¡TIEMPO DE DESCANSO!</Text>
      
      {/* Glow effect and timer circle */}
      <View style={styles.timerOuterCircle}>
        <View style={styles.timerInnerCircle}>
          <Text style={styles.timerText}>{timeRemaining}</Text>
          <Text style={styles.timerSub}>segundos</Text>
        </View>
      </View>

      {/* Adjust rest time buttons */}
      <View style={styles.adjustRow}>
        <Pressable onPress={() => onAddSeconds(15)} style={styles.adjustButton}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.adjustButtonText}>+15s</Text>
        </Pressable>
        <Pressable onPress={() => onAddSeconds(30)} style={styles.adjustButton}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.adjustButtonText}>+30s</Text>
        </Pressable>
      </View>

      {/* Next exercise preview card */}
      {nextExercise && (
        <View style={styles.nextContainer}>
          <Text style={styles.nextHeader}>Siguiente ejercicio:</Text>
          <View style={styles.nextCard}>
            <ExerciseVisualizer path={nextExercise.image} type="image" style={styles.nextThumbnail} />
            <View style={styles.nextInfo}>
              <Text style={styles.nextName} numberOfLines={1}>
                {translateExerciseName(nextExercise.name)}
              </Text>
              <Text style={styles.nextDetails}>
                {translateMuscle(nextExercise.body_part)} • {translateEquipment(nextExercise.equipment)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Skip button */}
      <Pressable onPress={onSkip} style={styles.skipButton}>
        <Play size={20} color={colors.background} fill={colors.background} />
        <Text style={styles.skipButtonText}>Omitir Descanso</Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    restTitle: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: 2,
      marginBottom: 30,
    },
    timerOuterCircle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      borderWidth: 4,
      borderColor: 'rgba(16, 185, 129, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
      marginBottom: 30,
    },
    timerInnerCircle: {
      width: 170,
      height: 170,
      borderRadius: 85,
      backgroundColor: '#121214',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timerText: {
      color: colors.primary,
      fontSize: 64,
      fontWeight: '900',
    },
    timerSub: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: -4,
    },
    adjustRow: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 40,
    },
    adjustButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    adjustButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    nextContainer: {
      width: '100%',
      marginBottom: 40,
    },
    nextHeader: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    nextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    nextThumbnail: {
      width: 50,
      height: 50,
      borderRadius: 8,
    },
    nextInfo: {
      flex: 1,
      marginLeft: 12,
    },
    nextName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    nextDetails: {
      color: colors.textMuted,
      fontSize: 12,
      textTransform: 'capitalize',
      marginTop: 2,
    },
    skipButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 30,
      width: '100%',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    },
    skipButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '700',
      marginLeft: 8,
    },
  });
}
