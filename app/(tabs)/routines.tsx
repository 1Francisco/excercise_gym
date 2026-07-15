import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { translateMuscle, translateExerciseName } from '../../src/constants/Translations';
import { storage } from '../../src/services/storage';
import { exercises } from '../../src/hooks/useExerciseFilter';
import { Routine, Exercise } from '../../src/types/exercise';
import ExerciseCard from '../../src/components/ExerciseCard';
import { Plus, Trash2, Play, X, Check, Search } from 'lucide-react-native';
import { useMemo } from 'react';

export default function RoutinesScreen() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [routineName, setRoutineName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Load routines from AsyncStorage
  const loadRoutines = async () => {
    const list = await storage.getRoutines();
    setRoutines(list);
  };

  useEffect(() => {
    loadRoutines();
  }, []);

  // Filter exercises for the creation checklist
  const checklistExercises = useMemo(() => {
    if (!searchQuery.trim()) return exercises.slice(0, 50); // Show top 50 by default to save rendering time
    const query = searchQuery.toLowerCase();
    return exercises.filter((ex) => {
      const matchesEnglish = ex.name.toLowerCase().includes(query);
      const matchesSpanish = translateExerciseName(ex.name).toLowerCase().includes(query);
      return matchesEnglish || matchesSpanish;
    });
  }, [searchQuery]);

  const handleToggleSelect = (id: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSaveRoutine = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la rutina.');
      return;
    }
    if (selectedExerciseIds.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un ejercicio.');
      return;
    }

    const newRoutine: Routine = {
      id: Date.now().toString(), // Simple unique ID
      name: routineName,
      exerciseIds: selectedExerciseIds,
      createdAt: new Date().toISOString(),
    };

    const success = await storage.saveRoutine(newRoutine);
    if (success) {
      setIsModalOpen(false);
      setRoutineName('');
      setSearchQuery('');
      setSelectedExerciseIds([]);
      loadRoutines();
    } else {
      Alert.alert('Error', 'Ocurrió un problema al guardar la rutina.');
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    Alert.alert('Eliminar Rutina', '¿Estás seguro de que deseas eliminar esta rutina?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await storage.deleteRoutine(id);
          loadRoutines();
        },
      },
    ]);
  };

  const handleStartWorkout = async (routine: Routine) => {
    await storage.saveActiveWorkout(routine.exerciseIds);
    // Redirect to the Active Workout tab
    router.navigate('/(tabs)/active-workout');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header button to add routine */}
      <View style={styles.headerRow}>
        <Text style={styles.infoText}>Crea y gestiona tus propios planes de entrenamiento</Text>
        <Pressable onPress={() => setIsModalOpen(true)} style={styles.createButton}>
          <Plus size={18} color={Colors.dark.background} />
          <Text style={styles.createButtonText}>Nueva Rutina</Text>
        </Pressable>
      </View>

      {/* Routines list */}
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const matchedExercises = item.exerciseIds
            .map((id) => exercises.find((ex) => ex.id === id))
            .filter((ex): ex is Exercise => !!ex);

          // Get unique muscles involved
          const targetMuscles = Array.from(new Set(matchedExercises.map((e) => translateMuscle(e.body_part))));

          return (
            <View style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{item.name}</Text>
                <Text style={styles.routineDetails}>
                  {item.exerciseIds.length} ejercicios • {targetMuscles.join(', ')}
                </Text>
              </View>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => handleStartWorkout(item)}
                  style={styles.startWorkoutButton}
                >
                  <Play size={14} color={Colors.dark.background} fill={Colors.dark.background} />
                  <Text style={styles.startWorkoutText}>Entrenar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteRoutine(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color={Colors.dark.accent} />
                </Pressable>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Aún no tienes rutinas</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primera rutina personalizada tocando el botón de arriba.
            </Text>
          </View>
        }
      />

      {/* Add Routine Modal */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Rutina</Text>
            <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalClose}>
              <X size={20} color={Colors.dark.text} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            {/* Input Name */}
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              placeholder="Ej: Día de Pecho, Piernas en Casa..."
              placeholderTextColor={Colors.dark.textMuted}
              value={routineName}
              onChangeText={setRoutineName}
              style={styles.textInput}
            />

            {/* Selection Title */}
            <Text style={styles.label}>Selecciona Ejercicios ({selectedExerciseIds.length})</Text>

            {/* Checklist Search */}
            <View style={styles.checklistSearchContainer}>
              <Search size={16} color={Colors.dark.textMuted} />
              <TextInput
                placeholder="Buscar ejercicios..."
                placeholderTextColor={Colors.dark.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.checklistSearchInput}
              />
              {searchQuery !== '' && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={16} color={Colors.dark.text} />
                </Pressable>
              )}
            </View>

            {/* Checklist items */}
            <FlatList
              data={checklistExercises}
              keyExtractor={(item) => item.id}
              style={styles.checklist}
              contentContainerStyle={{ paddingBottom: 16 }}
              renderItem={({ item }) => {
                const isSelected = selectedExerciseIds.includes(item.id);
                return (
                  <Pressable
                    onPress={() => handleToggleSelect(item.id)}
                    style={[styles.checklistItem, isSelected && styles.checklistItemActive]}
                  >
                    <View style={styles.checklistLeft}>
                      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                        {isSelected && <Check size={12} color={Colors.dark.background} />}
                      </View>
                      <Text style={[styles.checklistName, isSelected && styles.checklistNameActive]}>
                        {translateExerciseName(item.name)}
                      </Text>
                    </View>
                    <Text style={styles.checklistDetails}>{translateMuscle(item.body_part)}</Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyChecklist}>No se encontraron ejercicios.</Text>
              }
            />
          </View>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Pressable onPress={handleSaveRoutine} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Guardar Rutina</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  infoText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    flex: 1,
    marginRight: 16,
    lineHeight: 18,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.dark.background,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  routineCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routineInfo: {
    flex: 1,
    marginRight: 16,
  },
  routineName: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  routineDetails: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startWorkoutText: {
    color: Colors.dark.background,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.card,
  },
  modalTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  label: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: Colors.dark.text,
    fontSize: 16,
    marginBottom: 16,
  },
  checklistSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  checklistSearchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 14,
    marginLeft: 8,
  },
  checklist: {
    flex: 1,
    borderColor: Colors.dark.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.cardBorder,
  },
  checklistItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.dark.tabIconDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: Colors.dark.primary,
  },
  checklistName: {
    color: Colors.dark.textMuted,
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  checklistNameActive: {
    color: Colors.dark.text,
    fontWeight: '600',
  },
  checklistDetails: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  emptyChecklist: {
    color: Colors.dark.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    backgroundColor: Colors.dark.card,
  },
  saveButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.dark.background,
    fontWeight: '700',
    fontSize: 16,
  },
});
