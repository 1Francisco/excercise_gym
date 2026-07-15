import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { storage } from '../../src/services/storage';
import { exercises as allExercises } from '../../src/hooks/useExerciseFilter';
import { translateExerciseName, translateMuscle } from '../../src/constants/Translations';
import type { Routine, RoutineExercise } from '../../src/types/exercise';
import { ChevronUp, ChevronDown, Plus, X, Play, Check, Search, Trash2, Save } from 'lucide-react-native';

const DEFAULT_SETS = 3;
const DEFAULT_REPS = 10;
const DEFAULT_REST = 60;

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState('');

  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    storage.getRoutines().then((list) => {
      const found = list.find((r) => r.id === id);
      if (found) {
        setRoutine(found);
        setName(found.name);
        if (found.exercises && found.exercises.length > 0) {
          setExercises(found.exercises);
        } else {
          setExercises(
            found.exerciseIds.map((eId) => ({
              exerciseId: eId,
              defaultSets: DEFAULT_SETS,
              defaultReps: DEFAULT_REPS,
              restTime: DEFAULT_REST,
            }))
          );
        }
      }
    });
  }, [id]);

  const exerciseData = useMemo(
    () =>
      exercises
        .map((re) => {
          const ex = allExercises.find((e) => e.id === re.exerciseId);
          return ex ? { ...re, name: translateExerciseName(ex.name), bodyPart: translateMuscle(ex.body_part) } : null;
        })
        .filter((e): e is NonNullable<typeof e> => !!e),
    [exercises]
  );

  const addableExercises = useMemo(() => {
    const existingIds = new Set(exercises.map((e) => e.exerciseId));
    const query = addSearch.toLowerCase();
    return allExercises.filter(
      (ex) => !existingIds.has(ex.id) && (ex.name.toLowerCase().includes(query) || translateExerciseName(ex.name).toLowerCase().includes(query))
    );
  }, [exercises, addSearch]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= exercises.length - 1) return;
    setExercises((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: number) => {
    setExercises((prev) => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const addExercisesToList = (eIds: string[]) => {
    setExercises((prev) => [
      ...prev,
      ...eIds
        .filter((eId) => !prev.some((p) => p.exerciseId === eId))
        .map((eId) => ({
          exerciseId: eId,
          defaultSets: DEFAULT_SETS,
          defaultReps: DEFAULT_REPS,
          restTime: DEFAULT_REST,
        })),
    ]);
    setShowAddModal(false);
    setAddSearch('');
  };

  const handleSave = async () => {
    if (!routine) return;
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre de la rutina no puede estar vacío.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Error', 'Debes tener al menos un ejercicio.');
      return;
    }

    const updated: Routine = {
      ...routine,
      name,
      exerciseIds: exercises.map((e) => e.exerciseId),
      exercises,
    };

    await storage.saveRoutine(updated);
    router.back();
  };

  const handleStart = async () => {
    if (exercises.length === 0) return;
    await storage.saveActiveWorkout(exercises.map((e) => e.exerciseId));
    await storage.saveWorkoutExerciseConfig(exercises);
    router.navigate('/(tabs)/active-workout');
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <X size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Rutina</Text>
        <Pressable onPress={handleSave} style={styles.saveHeaderBtn}>
          <Save size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.nameRow}>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.nameInput}
          placeholderTextColor={colors.textMuted}
          placeholder="Nombre de la rutina"
        />
      </View>

      <FlatList
        data={exerciseData}
        keyExtractor={(item) => item.exerciseId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>{item.bodyPart}</Text>
              </View>
              <View style={styles.reorderGroup}>
                <Pressable onPress={() => moveUp(index)} disabled={index === 0} style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}>
                  <ChevronUp size={16} color={index === 0 ? colors.textMuted : colors.text} />
                </Pressable>
                <Pressable onPress={() => moveDown(index)} disabled={index >= exercises.length - 1} style={[styles.moveBtn, index >= exercises.length - 1 && styles.moveBtnDisabled]}>
                  <ChevronDown size={16} color={index >= exercises.length - 1 ? colors.textMuted : colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.configRow}>
              <View style={styles.configGroup}>
                <Text style={styles.configLabel}>Series</Text>
                <TextInput
                  style={styles.configInput}
                  value={String(exercises[index]?.defaultSets ?? DEFAULT_SETS)}
                  keyboardType="number-pad"
                  onChangeText={(t) => updateExercise(index, 'defaultSets', parseInt(t) || 0)}
                />
              </View>
              <View style={styles.configGroup}>
                <Text style={styles.configLabel}>Reps</Text>
                <TextInput
                  style={styles.configInput}
                  value={String(exercises[index]?.defaultReps ?? DEFAULT_REPS)}
                  keyboardType="number-pad"
                  onChangeText={(t) => updateExercise(index, 'defaultReps', parseInt(t) || 0)}
                />
              </View>
              <View style={styles.configGroup}>
                <Text style={styles.configLabel}>Descanso (s)</Text>
                <TextInput
                  style={styles.configInput}
                  value={String(exercises[index]?.restTime ?? DEFAULT_REST)}
                  keyboardType="number-pad"
                  onChangeText={(t) => updateExercise(index, 'restTime', parseInt(t) || 0)}
                />
              </View>
              <Pressable onPress={() => removeExercise(index)} style={styles.removeBtn}>
                <Trash2 size={16} color={colors.accent} />
              </Pressable>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <Pressable onPress={() => setShowAddModal(true)} style={styles.addButton}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addButtonText}>Agregar Ejercicios</Text>
          </Pressable>
        }
        ListFooterComponent={
          <View style={styles.footerButtons}>
            <Pressable onPress={handleSave} style={styles.saveButton}>
              <Save size={18} color={colors.background} />
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            </Pressable>
            <Pressable onPress={handleStart} style={styles.startButton}>
              <Play size={18} color={colors.background} fill={colors.background} />
              <Text style={styles.saveButtonText}>Empezar Entrenamiento</Text>
            </Pressable>
          </View>
        }
      />

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Ejercicios</Text>
            <Pressable onPress={() => { setShowAddModal(false); setAddSearch(''); }} style={styles.modalClose}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.searchRow}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Buscar..."
              placeholderTextColor={colors.textMuted}
              value={addSearch}
              onChangeText={setAddSearch}
              style={styles.searchInput}
            />
            {addSearch !== '' && (
              <Pressable onPress={() => setAddSearch('')}>
                <X size={16} color={colors.text} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={addableExercises}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.addList}
            renderItem={({ item }) => (
              <Pressable
                style={styles.addItem}
                onPress={() => addExercisesToList([item.id])}
              >
                <View style={styles.addItemLeft}>
                  <View style={styles.addCheckbox}>
                    <Plus size={12} color={colors.primary} />
                  </View>
                  <Text style={styles.addItemName}>{translateExerciseName(item.name)}</Text>
                </View>
                <Text style={styles.addItemMuscle}>{translateMuscle(item.body_part)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No se encontraron ejercicios.</Text>
            }
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  saveHeaderBtn: { padding: 4 },
  nameRow: { paddingHorizontal: 16, paddingVertical: 12 },
  nameInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: { padding: 16, paddingBottom: 40 },
  exerciseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseInfo: { flex: 1, marginRight: 8 },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  exerciseMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  reorderGroup: { flexDirection: 'row', gap: 4 },
  moveBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moveBtnDisabled: { opacity: 0.4 },
  configRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  configGroup: { flex: 1 },
  configLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 2 },
  configInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlign: 'center',
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  addButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  footerButtons: { gap: 10, marginTop: 8 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalContainer: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  modalClose: { padding: 4 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    margin: 16,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, marginLeft: 8 },
  addList: { paddingHorizontal: 16 },
  addItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  addItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  addCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addItemName: { color: colors.text, fontSize: 15, fontWeight: '500', textTransform: 'capitalize', flex: 1 },
  addItemMuscle: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase' },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});
}
