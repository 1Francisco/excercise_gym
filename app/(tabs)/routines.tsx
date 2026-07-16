import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { translateMuscle, translateExerciseName } from '../../src/constants/Translations';
import { storage } from '../../src/services/storage';
import { exercises } from '../../src/hooks/useExerciseFilter';
import { Routine, Exercise } from '../../src/types/exercise';
import SkeletonCard from '../../src/components/SkeletonCard';
import { DEFAULT_ROUTINES } from '../../src/constants/defaultRoutines';
import { Plus, Trash2, Play, Edit3, X, Check, Search, Copy, Bell, BellOff } from 'lucide-react-native';
import { requestNotificationPermissions, scheduleDailyReminder, cancelAllScheduled, getSavedReminder } from '../../src/services/notifications';
import { exportAllData, importAllData } from '../../src/services/backup';

export default function RoutinesScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Form State
  const [routineName, setRoutineName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Notification states
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(8);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderActive, setReminderActive] = useState(false);

  // Load saved reminder on mount
  useEffect(() => {
    getSavedReminder().then((saved) => {
      if (saved) {
        setReminderHour(saved.hour);
        setReminderMinute(saved.minute);
        setReminderActive(true);
        setReminderEnabled(true);
      }
    });
  }, []);

  // Load routines from AsyncStorage
  const loadRoutines = async () => {
    setIsLoadingRoutines(true);
    const list = await storage.getRoutines();
    setRoutines(list);
    setIsLoadingRoutines(false);
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

  const handleCreateFromTemplate = async (template: typeof DEFAULT_ROUTINES[0]) => {
    const newRoutine: Routine = {
      id: Date.now().toString(),
      name: template.name,
      exerciseIds: template.exercises.map((e) => e.exerciseId),
      exercises: template.exercises,
      createdAt: new Date().toISOString(),
    };
    await storage.saveRoutine(newRoutine);
    setShowTemplates(false);
    loadRoutines();
  };

  const handleEditRoutine = (id: string) => {
    router.push(`/routine/${id}`);
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
    if (routine.exercises && routine.exercises.length > 0) {
      await storage.saveWorkoutExerciseConfig(routine.exercises);
    }
    router.navigate('/(tabs)/active-workout');
  };

  const handleToggleReminder = async () => {
    if (reminderEnabled) {
      await cancelAllScheduled();
      setReminderActive(false);
      setReminderEnabled(false);
    } else {
      const granted = await requestNotificationPermissions();
      if (granted) {
        setReminderEnabled(true);
      }
    }
  };

  const handleSaveReminder = async () => {
    if (!reminderEnabled) return;
    const id = await scheduleDailyReminder(reminderHour, reminderMinute);
    if (id) {
      setReminderActive(true);
    }
  };

  const handleCancelReminder = async () => {
    await cancelAllScheduled();
    setReminderActive(false);
    setReminderEnabled(false);
  };

  const handleExportData = async () => {
    const ok = await exportAllData();
    if (ok) Alert.alert('Exportado', 'Tus datos se han exportado correctamente.');
    else Alert.alert('Error', 'No se pudieron exportar los datos.');
  };

  const handleImportData = async () => {
    const result = await importAllData();
    if (result.success) {
      Alert.alert('Importado', result.message);
    } else if (result.message !== 'Importación cancelada') {
      Alert.alert('Error', result.message);
    }
  };

  const renderNotificationSection = () => (
    <View style={styles.notificationSection}>
      <View style={styles.notificationHeader}>
        <Text style={styles.sectionTitle}>Recordatorio Diario</Text>
        <Pressable onPress={handleToggleReminder} style={styles.toggleButton}>
          {reminderEnabled ? (
            <Bell size={20} color={colors.primary} />
          ) : (
            <BellOff size={20} color={colors.textMuted} />
          )}
        </Pressable>
      </View>
      {reminderEnabled && (
        <View style={styles.reminderBody}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Hora:</Text>
            <View style={styles.timeInputGroup}>
              <Pressable
                onPress={() => setReminderHour((reminderHour + 23) % 24)}
                style={styles.timeAdjust}
              >
                <Text style={styles.timeAdjustText}>-1h</Text>
              </Pressable>
              <Text style={styles.timeValue}>
                {String(reminderHour).padStart(2, '0')}:{String(reminderMinute).padStart(2, '0')}
              </Text>
              <Pressable
                onPress={() => setReminderHour((reminderHour + 1) % 24)}
                style={styles.timeAdjust}
              >
                <Text style={styles.timeAdjustText}>+1h</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Minuto:</Text>
            <View style={styles.timeInputGroup}>
              <Pressable
                onPress={() => setReminderMinute((reminderMinute + 55) % 60)}
                style={styles.timeAdjust}
              >
                <Text style={styles.timeAdjustText}>-5m</Text>
              </Pressable>
              <Text style={styles.timeValue}>
                {String(reminderHour).padStart(2, '0')}:{String(reminderMinute).padStart(2, '0')}
              </Text>
              <Pressable
                onPress={() => setReminderMinute((reminderMinute + 5) % 60)}
                style={styles.timeAdjust}
              >
                <Text style={styles.timeAdjustText}>+5m</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.reminderActions}>
            <Pressable onPress={handleSaveReminder} style={styles.saveReminderButton}>
              <Text style={styles.saveReminderText}>Guardar Recordatorio</Text>
            </Pressable>
            {reminderActive && (
              <Pressable onPress={handleCancelReminder} style={styles.cancelReminderButton}>
                <Text style={styles.cancelReminderText}>Cancelar Recordatorio</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* ─── Data Backup Section ─────────────────────────── */}
      <View style={styles.backupSection}>
        <Text style={styles.sectionTitle}>Respaldar Datos</Text>
        <View style={styles.backupRow}>
          <Pressable onPress={handleExportData} style={styles.exportButton}>
            <Text style={styles.exportButtonText}>Exportar Datos</Text>
          </Pressable>
          <Pressable onPress={handleImportData} style={styles.importButton}>
            <Text style={styles.importButtonText}>Importar Datos</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header button to add routine */}
      <View style={styles.headerRow}>
        <Text style={styles.infoText}>Crea y gestiona tus propios planes de entrenamiento</Text>
        <View style={styles.headerButtons}>
          <Pressable onPress={() => setShowTemplates(true)} style={styles.templateButton}>
            <Copy size={16} color={colors.primary} />
          </Pressable>
          <Pressable onPress={() => setIsModalOpen(true)} style={styles.createButton}>
            <Plus size={18} color={colors.background} />
            <Text style={styles.createButtonText}>Nueva Rutina</Text>
          </Pressable>
        </View>
      </View>

      {/* Routines list */}
      {isLoadingRoutines ? (
        <View style={styles.listContainer}>
          <SkeletonCard height={80} lines={2} />
          <SkeletonCard height={80} lines={2} />
          <SkeletonCard height={80} lines={2} />
        </View>
      ) : (
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderNotificationSection}
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
                  <Play size={14} color={colors.background} fill={colors.background} />
                  <Text style={styles.startWorkoutText}>Entrenar</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEditRoutine(item.id)}
                  style={styles.editButton}
                >
                  <Edit3 size={16} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteRoutine(item.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color={colors.accent} />
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
      )}
 
      {/* Add Routine Modal */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Crear Rutina</Text>
            <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalClose}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            {/* Input Name */}
            <Text style={styles.label}>Nombre de la rutina</Text>
            <TextInput
              placeholder="Ej: Día de Pecho, Piernas en Casa..."
              placeholderTextColor={colors.textMuted}
              value={routineName}
              onChangeText={setRoutineName}
              style={styles.textInput}
            />

            {/* Selection Title */}
            <Text style={styles.label}>Selecciona Ejercicios ({selectedExerciseIds.length})</Text>

            {/* Checklist Search */}
            <View style={styles.checklistSearchContainer}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                placeholder="Buscar ejercicios..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.checklistSearchInput}
              />
              {searchQuery !== '' && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X size={16} color={colors.text} />
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
                        {isSelected && <Check size={12} color={colors.background} />}
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

      {/* Templates Modal */}
      <Modal visible={showTemplates} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plantillas de Rutina</Text>
            <Pressable onPress={() => setShowTemplates(false)} style={styles.modalClose}>
              <X size={20} color={colors.text} />
            </Pressable>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalSub}>Selecciona una plantilla para crear una rutina predefinida:</Text>
            <FlatList
              data={DEFAULT_ROUTINES}
              keyExtractor={(_, i) => String(i)}
              contentContainerStyle={{ paddingBottom: 24 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleCreateFromTemplate(item)}
                  style={styles.templateCard}
                >
                  <Text style={styles.templateName}>{item.name}</Text>
                  <Text style={styles.templateDesc}>{item.description}</Text>
                  <Text style={styles.templateCount}>{item.exercises.length} ejercicios</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
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
  headerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
    marginRight: 16,
    lineHeight: 18,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  templateButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    borderWidth: 1,
    borderColor: `rgba(${pR}, ${pG}, ${pB}, 0.3)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  routineCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  routineDetails: {
    color: colors.textMuted,
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
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startWorkoutText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  editButton: {
    padding: 8,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    borderRadius: 8,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  modalTitle: {
    color: colors.text,
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
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  checklistSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  checklistSearchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    marginLeft: 8,
  },
  checklist: {
    flex: 1,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  checklistItemActive: {
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.05)`,
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
    borderColor: colors.tabIconDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checklistName: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  checklistNameActive: {
    color: colors.text,
    fontWeight: '600',
  },
  checklistDetails: {
    color: colors.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  emptyChecklist: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 16,
  },
  // ─── Notification Reminder ───────────────────────────
  notificationSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toggleButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderBody: {
    marginTop: 16,
    gap: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  timeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAdjust: {
    width: 44,
    height: 32,
    borderRadius: 6,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeAdjustText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  timeValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    minWidth: 56,
    textAlign: 'center',
  },
  reminderActions: {
    marginTop: 8,
    gap: 8,
  },
  saveReminderButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveReminderText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 14,
  },
  cancelReminderButton: {
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    borderWidth: 1,
    borderColor: `rgba(${pR}, ${pG}, ${pB}, 0.3)`,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelReminderText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },

  backupSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  backupRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  exportButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: colors.background,
    fontWeight: '700',
    fontSize: 13,
  },
  importButton: {
    flex: 1,
    backgroundColor: `rgba(${pR}, ${pG}, ${pB}, 0.1)`,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  importButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  modalSub: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 10,
  },
  templateName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  templateDesc: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  templateCount: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
}
