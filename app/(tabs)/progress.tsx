import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { storage } from '../../src/services/storage';
import ProgressChart from '../../src/components/ProgressChart';
import type { BodyMeasurement } from '../../src/types/nutrition';
import type { WorkoutSession } from '../../src/types/exercise';
import { BarChart3, Trophy, Flame, Dumbbell, ChevronDown, ChevronUp, Share2, Plus } from 'lucide-react-native';
import ViewShot from 'react-native-view-shot';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { translateExerciseName } from '../../src/constants/Translations';
import { exercises } from '../../src/hooks/useExerciseFilter';

function getWeekDates(): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getDayLabel(dateStr: string): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[new Date(dateStr + 'T12:00:00').getDay()];
}

function calculateStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;
  for (const date of uniqueDates) {
    if (date === checkDate) {
      streak++;
      const d = new Date(checkDate + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else if (date < checkDate) {
      break;
    }
  }
  return streak;
}

function getMuscleDistribution(sessions: WorkoutSession[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const session of sessions) {
    for (const exProgress of session.exercises) {
      const found = exercises.find((e) => e.id === exProgress.exerciseId);
      if (found) {
        const muscle = found.target || found.muscle_group || found.body_part;
        counts[muscle] = (counts[muscle] || 0) + 1;
      }
    }
  }
  return counts;
}

function getExerciseName(id: string): string {
  const found = exercises.find((e) => e.id === id);
  return found ? translateExerciseName(found.name) : id;
}

export default function ProgressScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);

  useEffect(() => {
    storage.getWorkoutHistory().then((data) => {
      setSessions(data.reverse());
      setLoading(false);
    });
    storage.getBodyMeasurements().then(setMeasurements);
  }, []);

  const viewShotRef = useRef<ViewShot>(null);

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 0.8 });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      }
    } catch {}
  };

  const weekDates = getWeekDates();
  const weekData = weekDates.map((date) => {
    const daySessions = sessions.filter((s) => s.date === date);
    const totalVolume = daySessions.reduce(
      (sum, s) =>
        sum + s.exercises.reduce((vol, e) => vol + e.sets.reduce((v, set) => v + set.reps * set.weight, 0), 0),
      0
    );
    return { label: getDayLabel(date), value: totalVolume, secondary: String(daySessions.length || '') };
  });

  const totalSessions = sessions.length;
  const totalVolume = sessions.reduce(
    (sum, s) =>
      sum + s.exercises.reduce((vol, e) => vol + e.sets.reduce((v, set) => v + set.reps * set.weight, 0), 0),
    0
  );
  const streak = calculateStreak(sessions);
  const muscleDist = getMuscleDistribution(sessions);
  const sortedMuscles = Object.entries(muscleDist)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);
  const recentSessions = sessions.slice(0, 20);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BarChart3 size={64} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Sin historial aún</Text>
            <Text style={styles.emptySubtitle}>
              Completa tu primer entrenamiento para ver tu progreso aquí.
            </Text>
          </View>
        ) : (
          <>
            {/* ─── Header Row ──────────────────────────────── */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Historial y Progreso</Text>
              <Pressable onPress={handleShare} style={styles.shareButton}>
                <Share2 size={18} color={colors.primary} />
              </Pressable>
            </View>

            {/* ─── Stats Grid ──────────────────────────────── */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.8 }}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Trophy size={20} color={colors.primary} />
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>Entrenos</Text>
              </View>
              <View style={styles.statCard}>
                <Flame size={20} color={colors.accent} />
                <Text style={styles.statValue}>{(totalVolume / 1000).toFixed(1)}k</Text>
                <Text style={styles.statLabel}>Vol. Total</Text>
              </View>
              <View style={styles.statCard}>
                <Dumbbell size={20} color={colors.warning} />
                <Text style={styles.statValue}>{streak}</Text>
                <Text style={styles.statLabel}>Racha (días)</Text>
              </View>
              <View style={styles.statCard}>
                <BarChart3 size={20} color={colors.primaryLight} />
                <Text style={styles.statValue}>
                  {totalSessions > 0 ? Math.round(totalVolume / totalSessions / 100) / 10 : 0}k
                </Text>
                <Text style={styles.statLabel}>Promedio</Text>
              </View>
            </View>

            {/* ─── Weekly Chart ────────────────────────────── */}
            <View style={styles.section}>
              <ProgressChart
                data={weekData}
                title="Volumen Semanal (kg)"
                barColor={colors.primary}
                height={140}
              />
            </View>

            {/* ─── Body Measurements ────────────────────────── */}
            {measurements.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Medidas Corporales</Text>
                <View style={styles.measurementGrid}>
                  {measurements.slice(-1).map(m => (
                    <React.Fragment key={m.date}>
                      {m.bodyFat && (
                        <View style={styles.measurementCard}>
                          <Text style={styles.measurementValue}>{m.bodyFat}%</Text>
                          <Text style={styles.measurementLabel}>Grasa Corporal</Text>
                        </View>
                      )}
                      {m.waist && (
                        <View style={styles.measurementCard}>
                          <Text style={styles.measurementValue}>{m.waist}cm</Text>
                          <Text style={styles.measurementLabel}>Cintura</Text>
                        </View>
                      )}
                      {m.chest && (
                        <View style={styles.measurementCard}>
                          <Text style={styles.measurementValue}>{m.chest}cm</Text>
                          <Text style={styles.measurementLabel}>Pecho</Text>
                        </View>
                      )}
                      {m.arms && (
                        <View style={styles.measurementCard}>
                          <Text style={styles.measurementValue}>{m.arms}cm</Text>
                          <Text style={styles.measurementLabel}>Brazos</Text>
                        </View>
                      )}
                    </React.Fragment>
                  ))}
                </View>
                <Text style={styles.measurementDate}>
                  {new Date(measurements[measurements.length-1].date + 'T12:00:00').toLocaleDateString('es-MX')}
                </Text>
                <Pressable
                  onPress={() => Alert.alert('Añadir Medidas', 'Ve a la pantalla de Nutrición para registrar tus medidas.')}
                  style={styles.addMeasurementButton}
                >
                  <Plus size={14} color={colors.primary} />
                  <Text style={styles.addMeasurementText}>Añadir medidas</Text>
                </Pressable>
              </View>
            )}

            {/* ─── Muscle Distribution ──────────────────────── */}
            {sortedMuscles.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Músculos Entrenados</Text>
                <View style={styles.muscleGrid}>
                  {sortedMuscles.map(([muscle, count]) => (
                    <View key={muscle} style={styles.muscleChip}>
                      <Text style={styles.muscleName} numberOfLines={1}>{muscle}</Text>
                      <Text style={styles.muscleCount}>{count}x</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ─── Recent Sessions ────────────────────────── */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Entrenamientos Recientes</Text>
              {recentSessions.map((session) => {
                const isExpanded = expandedSession === session.id;
                const sessionVolume = session.exercises.reduce(
                  (sum, e) => sum + e.sets.reduce((v, s) => v + s.reps * s.weight, 0), 0
                );

                return (
                  <Pressable
                    key={session.id}
                    style={styles.sessionCard}
                    onPress={() => setExpandedSession(isExpanded ? null : session.id)}
                  >
                    <View style={styles.sessionHeader}>
                      <View>
                        <Text style={styles.sessionDate}>
                          {new Date(session.date + 'T12:00:00').toLocaleDateString('es-MX', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </Text>
                        <Text style={styles.sessionMeta}>
                          {session.totalExercises} ejercicios · {session.totalSets} series · {sessionVolume} kg
                        </Text>
                      </View>
                      {isExpanded ? (
                        <ChevronUp size={18} color={colors.textMuted} />
                      ) : (
                        <ChevronDown size={18} color={colors.textMuted} />
                      )}
                    </View>

                    {isExpanded && (
                      <View style={styles.sessionDetail}>
                        {session.exercises.map((exProgress) => {
                          const exVolume = exProgress.sets.reduce((v, s) => v + s.reps * s.weight, 0);
                          return (
                            <View key={exProgress.exerciseId} style={styles.exerciseRow}>
                              <Text style={styles.exerciseName} numberOfLines={1}>
                                {getExerciseName(exProgress.exerciseId)}
                              </Text>
                              <Text style={styles.exerciseSets}>
                                {exProgress.sets.length} series · {exVolume} kg
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
            </ViewShot>
          </>
        )}
      </ScrollView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ─── Header ─────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  shareButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Stats ──────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ─── Sections ──────────────────────────────────────────
  section: {
    marginBottom: 24,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },

  // ─── Muscle Distribution ──────────────────────────────
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.08)`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: `rgba(${pR}, ${pG}, ${pB}, 0.15)`,
  },
  muscleName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  muscleCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── Body Measurements ──────────────────────────────
  measurementGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8,
  },
  measurementCard: {
    flex: 1, minWidth: '45%', backgroundColor: colors.background,
    borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder,
    padding: 12, alignItems: 'center', gap: 4,
  },
  measurementValue: {
    color: colors.primary, fontSize: 20, fontWeight: '800',
  },
  measurementLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '600',
  },
  measurementDate: {
    color: colors.textMuted, fontSize: 11, marginBottom: 8,
  },
  addMeasurementButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
  },
  addMeasurementText: {
    color: colors.primary, fontSize: 13, fontWeight: '600',
  },

  // ─── Session Cards ────────────────────────────────────
  sessionCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDate: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  sessionMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sessionDetail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  exerciseSets: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
}
