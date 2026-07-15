import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Colors from '../constants/Colors';
import { storage } from '../services/storage';
import { exercises } from '../hooks/useExerciseFilter';
import { router } from 'expo-router';
import { Sparkles, ChevronRight } from 'lucide-react-native';

type BodyPart = 'back' | 'cardio' | 'chest' | 'lower arms' | 'lower legs' | 'neck' | 'shoulders' | 'upper arms' | 'upper legs' | 'waist';

const MUSCLE_LABELS: Record<string, string> = {
  back: 'Espalda',
  chest: 'Pecho',
  shoulders: 'Hombros',
  'upper arms': 'Brazos',
  'lower arms': 'Antebrazos',
  'upper legs': 'Piernas',
  'lower legs': 'Gemelos',
  waist: 'Abdomen',
  neck: 'Cuello',
  cardio: 'Cardio',
};

export default function RoutineSuggestion() {
  const { colors } = useTheme();
  const [suggestion, setSuggestion] = useState<{ bodyPart: BodyPart; count: number; exerciseCount: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const history = await storage.getWorkoutHistory();
      if (history.length === 0) {
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const session of history) {
        if (session.date >= thirtyDaysAgo.toISOString().split('T')[0]) {
          for (const exProgress of session.exercises) {
            const ex = exercises.find(e => e.id === exProgress.exerciseId);
            if (ex) {
              counts[ex.body_part] = (counts[ex.body_part] || 0) + 1;
            }
          }
        }
      }

      const bodyParts = [...new Set(exercises.map(e => e.body_part))] as BodyPart[];
      let leastTrained: BodyPart | null = null;
      let minCount = Infinity;

      for (const bp of bodyParts) {
        const available = exercises.filter(e => e.body_part === bp).length;
        if (available === 0) continue;
        const c = counts[bp] || 0;
        if (c < minCount) {
          minCount = c;
          leastTrained = bp;
        }
      }

      if (leastTrained) {
        const available = exercises.filter(e => e.body_part === leastTrained).length;
        setSuggestion({
          bodyPart: leastTrained,
          count: minCount,
          exerciseCount: available,
        });
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !suggestion) return null;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({
        pathname: '/(tabs)',
        params: { filter: suggestion.bodyPart },
      })}
    >
      <View style={styles.content}>
        <Sparkles size={20} color="#a855f7" />
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }]}>
            Rutina sugerida: {MUSCLE_LABELS[suggestion.bodyPart] || suggestion.bodyPart}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {suggestion.exerciseCount} ejercicios disponibles · No has entrenado esta zona recientemente
          </Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 16,
  },
});
