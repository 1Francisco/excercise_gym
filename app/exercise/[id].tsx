import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, FlatList, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { exercises } from '../../src/hooks/useExerciseFilter';
import { storage } from '../../src/services/storage';
import { Routine } from '../../src/types/exercise';
import ExerciseVisualizer from '../../src/components/ExerciseVisualizer';
import { ArrowLeft, CheckCircle2, Info, Plus, X, Check, FolderPlus } from 'lucide-react-native';
import { translateMuscle, translateEquipment, translateExerciseName } from '../../src/constants/Translations';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Find matching exercise
  const exercise = exercises.find((ex) => ex.id === id);

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const loadRoutines = async () => {
    const list = await storage.getRoutines();
    setRoutines(list);
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  const handleAddToExisting = async (routine: Routine) => {
    if (!exercise) return;
    if (routine.exerciseIds.includes(exercise.id)) {
      Alert.alert('Ya está', `${translateExerciseName(exercise.name)} ya está en "${routine.name}".`);
      return;
    }
    const updated: Routine = {
      ...routine,
      exerciseIds: [...routine.exerciseIds, exercise.id],
    };
    await storage.saveRoutine(updated);
    setIsModalOpen(false);
    setIsCreating(false);
    setNewRoutineName('');
    loadRoutines();
  };

  const handleCreateAndAdd = async () => {
    if (!exercise || !newRoutineName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la rutina.');
      return;
    }
    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: newRoutineName.trim(),
      exerciseIds: [exercise.id],
      createdAt: new Date().toISOString(),
    };
    await storage.saveRoutine(newRoutine);
    setIsModalOpen(false);
    setIsCreating(false);
    setNewRoutineName('');
    loadRoutines();
  };

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
          priority="high"
          style={styles.gifContainer}
        />

        {/* Details card */}
        <View style={styles.contentContainer}>
          {/* Exercise Name + Add Button */}
          <View style={styles.nameRow}>
            <Text style={styles.exerciseName}>{translateExerciseName(exercise.name)}</Text>
            <Pressable
              onPress={() => {
                setIsCreating(false);
                setNewRoutineName('');
                setIsModalOpen(true);
              }}
              style={styles.addToRoutineButton}
            >
              <Plus size={18} color={colors.background} />
              <Text style={styles.addToRoutineButtonText}>Rutina</Text>
            </Pressable>
          </View>
          
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
                  <CheckCircle2 size={18} color={colors.primary} style={styles.stepIcon} />
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attribution footer */}
          <View style={styles.attributionContainer}>
            <Info size={14} color={colors.textMuted} />
            <Text style={styles.attributionText}>{exercise.attribution}</Text>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Añadir a rutina
              </Text>
              <Pressable
                onPress={() => {
                  setIsModalOpen(false);
                  setIsCreating(false);
                  setNewRoutineName('');
                }}
                style={styles.modalClose}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {isCreating ? (
                <View>
                  <Text style={styles.label}>Nombre de la nueva rutina</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ej: Día de Pecho, Full Body..."
                    placeholderTextColor={colors.textMuted}
                    value={newRoutineName}
                    onChangeText={setNewRoutineName}
                    autoFocus
                  />
                  <Pressable onPress={handleCreateAndAdd} style={styles.saveButton}>
                    <Check size={18} color={colors.background} />
                    <Text style={styles.saveButtonText}>Crear y Añadir</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setIsCreating(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Volver</Text>
                  </Pressable>
                </View>
              ) : routines.length === 0 ? (
                <View>
                  <Text style={styles.emptyRoutinesText}>
                    Aún no tienes rutinas. Crea una nueva para añadir este ejercicio.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setIsCreating(true);
                      setNewRoutineName(translateExerciseName(exercise.name));
                    }}
                    style={styles.createNewButton}
                  >
                    <FolderPlus size={18} color={colors.background} />
                    <Text style={styles.createNewButtonText}>Nueva Rutina</Text>
                  </Pressable>
                </View>
              ) : (
                <View>
                  <Text style={styles.label}>Selecciona una rutina</Text>
                  <FlatList
                    data={routines}
                    keyExtractor={(item) => item.id}
                    style={styles.routinesList}
                    renderItem={({ item }) => {
                      const alreadyHas = exercise
                        ? item.exerciseIds.includes(exercise.id)
                        : false;
                      return (
                        <Pressable
                          onPress={() => handleAddToExisting(item)}
                          style={[styles.routineItem, alreadyHas && styles.routineItemDisabled]}
                        >
                          <View style={styles.routineItemLeft}>
                            <Text style={styles.routineItemName}>{item.name}</Text>
                            <Text style={styles.routineItemCount}>
                              {item.exerciseIds.length} ejercicios
                              {alreadyHas ? ' (ya incluido)' : ''}
                            </Text>
                          </View>
                          <Plus size={18} color={alreadyHas ? colors.textMuted : colors.primary} />
                        </Pressable>
                      );
                    }}
                  />
                  <Pressable
                    onPress={() => {
                      setIsCreating(true);
                      setNewRoutineName(translateExerciseName(exercise.name));
                    }}
                    style={styles.createNewButton}
                  >
                    <FolderPlus size={18} color={colors.background} />
                    <Text style={styles.createNewButtonText}>Nueva Rutina</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textTransform: 'capitalize',
    flex: 1,
  },
  addToRoutineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  addToRoutineButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
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
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
  },
  metadataLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metadataValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  secondaryTagText: {
    color: colors.text,
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
    color: colors.text,
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
    borderTopColor: colors.cardBorder,
    gap: 6,
  },
  attributionText: {
    color: colors.textMuted,
    fontSize: 11,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: colors.background,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 48,
    gap: 8,
    marginBottom: 8,
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyRoutinesText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 48,
    gap: 8,
    marginTop: 8,
  },
  createNewButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
  routinesList: {
    maxHeight: 260,
    marginBottom: 8,
  },
  routineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 8,
  },
  routineItemDisabled: {
    opacity: 0.5,
  },
  routineItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  routineItemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  routineItemCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
}
