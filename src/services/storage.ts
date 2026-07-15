import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, WorkoutSession, ExerciseProgress, SetEntry, RoutineExercise, ThemeMode } from '../types/exercise';
import { MealEntry, WaterLog, WeightEntry } from '../types/nutrition';

const ROUTINES_STORAGE_KEY = '@fitness_routines_v1';
const ACTIVE_WORKOUT_STORAGE_KEY = '@active_workout_state_v1';
const WORKOUT_PROGRESS_STORAGE_KEY = '@workout_progress_v1';
const WORKOUT_EXERCISE_CONFIG_KEY = '@workout_exercise_config_v1';
const WORKOUT_HISTORY_KEY = '@workout_history_v1';
const EXERCISE_PROGRESS_KEY = '@exercise_progress_v1';
const PERSONAL_RECORDS_KEY = '@personal_records_v1';
const MEAL_LOGS_KEY = '@meal_logs_v1';
const WATER_LOGS_KEY = '@water_logs_v1';
const WEIGHT_HISTORY_KEY = '@weight_history_v1';
const THEME_PREFERENCE_KEY = '@theme_preference_v1';

export const storage = {
  /**
   * Obtiene todas las rutinas guardadas por el usuario.
   */
  async getRoutines(): Promise<Routine[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Error al cargar rutinas:', e);
      return [];
    }
  },

  /**
   * Guarda una nueva rutina o actualiza una existente.
   */
  async saveRoutine(routine: Routine): Promise<boolean> {
    try {
      const routines = await this.getRoutines();
      const existingIndex = routines.findIndex((r) => r.id === routine.id);

      if (existingIndex >= 0) {
        routines[existingIndex] = routine;
      } else {
        routines.push(routine);
      }

      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routines));
      return true;
    } catch (e) {
      console.error('Error al guardar rutina:', e);
      return false;
    }
  },

  /**
   * Elimina una rutina por su ID.
   */
  async deleteRoutine(id: string): Promise<boolean> {
    try {
      const routines = await this.getRoutines();
      const filtered = routines.filter((r) => r.id !== id);
      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error al eliminar rutina:', e);
      return false;
    }
  },

  /**
   * Inicia o guarda el estado de un entrenamiento activo.
   */
  async saveActiveWorkout(exerciseIds: string[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(ACTIVE_WORKOUT_STORAGE_KEY, JSON.stringify(exerciseIds));
      return true;
    } catch (e) {
      console.error('Error al guardar entrenamiento activo:', e);
      return false;
    }
  },

  /**
   * Carga los IDs de los ejercicios del entrenamiento activo actual.
   */
  async getActiveWorkout(): Promise<string[] | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(ACTIVE_WORKOUT_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error al obtener entrenamiento activo:', e);
      return null;
    }
  },

  /**
   * Limpia el entrenamiento activo actual.
   */
  async clearActiveWorkout(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(ACTIVE_WORKOUT_STORAGE_KEY);
      await AsyncStorage.removeItem(WORKOUT_PROGRESS_STORAGE_KEY);
      await AsyncStorage.removeItem(WORKOUT_EXERCISE_CONFIG_KEY);
      return true;
    } catch (e) {
      console.error('Error al limpiar entrenamiento activo:', e);
      return false;
    }
  },

  /**
   * Guarda la configuración personalizada de cada ejercicio (sets, reps, descanso).
   */
  async saveWorkoutExerciseConfig(configs: RoutineExercise[]): Promise<boolean> {
    try {
      await AsyncStorage.setItem(WORKOUT_EXERCISE_CONFIG_KEY, JSON.stringify(configs));
      return true;
    } catch (e) {
      console.error('Error al guardar config de ejercicios:', e);
      return false;
    }
  },

  /**
   * Carga la configuración personalizada de los ejercicios del entrenamiento activo.
   */
  async getWorkoutExerciseConfig(): Promise<RoutineExercise[] | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(WORKOUT_EXERCISE_CONFIG_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error al obtener config de ejercicios:', e);
      return null;
    }
  },

  /**
   * Guarda el progreso del entrenamiento activo (currentIndex, isResting, etc.).
   */
  async saveWorkoutProgress(progress: {
    currentIndex: number;
    isResting: boolean;
    isPaused: boolean;
    timeRemaining: number;
  }): Promise<boolean> {
    try {
      await AsyncStorage.setItem(WORKOUT_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (e) {
      console.error('Error al guardar progreso del entrenamiento:', e);
      return false;
    }
  },

  /**
   * Carga el progreso guardado del entrenamiento activo.
   */
  async getWorkoutProgress(): Promise<{
    currentIndex: number;
    isResting: boolean;
    isPaused: boolean;
    timeRemaining: number;
  } | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(WORKOUT_PROGRESS_STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error al obtener progreso del entrenamiento:', e);
      return null;
    }
  },

  /**
   * Obtiene la meta de calorías y macros guardada.
   */
  async getCalorieGoal(): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goalType: string;
  } | null> {
    try {
      const jsonValue = await AsyncStorage.getItem('@nutrition_goal_v1');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error al obtener meta de calorías:', e);
      return null;
    }
  },

  /**
   * Guarda la meta de calorías y macros.
   */
  async saveCalorieGoal(goal: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goalType: string;
  }): Promise<boolean> {
    try {
      await AsyncStorage.setItem('@nutrition_goal_v1', JSON.stringify(goal));
      return true;
    } catch (e) {
      console.error('Error al guardar meta de calorías:', e);
      return false;
    }
  },

  /**
   * Obtiene todos los logs diarios de nutrición.
   */
  async getDailyLogs(): Promise<Record<string, { 
    caloriesConsumed: number; 
    weight?: number;
    proteinConsumed?: number;
    carbsConsumed?: number;
    fatConsumed?: number;
  }>> {
    try {
      const jsonValue = await AsyncStorage.getItem('@nutrition_logs_v1');
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Error al obtener logs diarios:', e);
      return {};
    }
  },

  /**
   * Guarda o actualiza el log de una fecha específica.
   */
  async saveDailyLog(
    date: string, 
    caloriesConsumed: number, 
    weight?: number,
    proteinConsumed?: number,
    carbsConsumed?: number,
    fatConsumed?: number
  ): Promise<boolean> {
    try {
      const logs = await this.getDailyLogs();
      const existing = logs[date] || { caloriesConsumed: 0, proteinConsumed: 0, carbsConsumed: 0, fatConsumed: 0 };
      
      logs[date] = {
        caloriesConsumed,
        weight: weight !== undefined ? weight : existing.weight,
        proteinConsumed: proteinConsumed !== undefined ? proteinConsumed : (existing.proteinConsumed || 0),
        carbsConsumed: carbsConsumed !== undefined ? carbsConsumed : (existing.carbsConsumed || 0),
        fatConsumed: fatConsumed !== undefined ? fatConsumed : (existing.fatConsumed || 0),
      };

      await AsyncStorage.setItem('@nutrition_logs_v1', JSON.stringify(logs));
      return true;
    } catch (e) {
      console.error('Error al guardar log diario:', e);
      return false;
    }
  },

  // ─── Workout History ───────────────────────────────────────────

  async getWorkoutHistory(): Promise<WorkoutSession[]> {
    try {
      const json = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Error al cargar historial:', e);
      return [];
    }
  },

  async saveWorkoutSession(session: WorkoutSession): Promise<boolean> {
    try {
      const history = await this.getWorkoutHistory();
      history.push(session);
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Error al guardar sesión:', e);
      return false;
    }
  },

  async getWorkoutSessionsByDateRange(startDate: string, endDate: string): Promise<WorkoutSession[]> {
    try {
      const history = await this.getWorkoutHistory();
      return history.filter(s => s.date >= startDate && s.date <= endDate);
    } catch (e) {
      console.error('Error al filtrar sesiones:', e);
      return [];
    }
  },

  // ─── Exercise Progress & PRs ──────────────────────────────────

  async getExerciseProgress(exerciseId: string): Promise<ExerciseProgress[]> {
    try {
      const json = await AsyncStorage.getItem(EXERCISE_PROGRESS_KEY);
      const all: Record<string, ExerciseProgress[]> = json ? JSON.parse(json) : {};
      return all[exerciseId] || [];
    } catch (e) {
      console.error('Error al cargar progreso:', e);
      return [];
    }
  },

  async saveExerciseProgress(exerciseId: string, progress: ExerciseProgress): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(EXERCISE_PROGRESS_KEY);
      const all: Record<string, ExerciseProgress[]> = json ? JSON.parse(json) : {};
      if (!all[exerciseId]) all[exerciseId] = [];
      all[exerciseId].push(progress);
      await AsyncStorage.setItem(EXERCISE_PROGRESS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Error al guardar progreso:', e);
      return false;
    }
  },

  async getPersonalRecords(): Promise<Record<string, SetEntry>> {
    try {
      const json = await AsyncStorage.getItem(PERSONAL_RECORDS_KEY);
      return json ? JSON.parse(json) : {};
    } catch (e) {
      console.error('Error al cargar PRs:', e);
      return {};
    }
  },

  async savePersonalRecord(exerciseId: string, set: SetEntry): Promise<boolean> {
    try {
      const records = await this.getPersonalRecords();
      const current = records[exerciseId];
      if (!current || set.weight > current.weight || (set.weight === current.weight && set.reps > current.reps)) {
        records[exerciseId] = set;
        await AsyncStorage.setItem(PERSONAL_RECORDS_KEY, JSON.stringify(records));
      }
      return true;
    } catch (e) {
      console.error('Error al guardar PR:', e);
      return false;
    }
  },

  // ─── Meal Entries (per date, by meal type) ────────────────────

  async getMealsByDate(date: string): Promise<MealEntry[]> {
    try {
      const json = await AsyncStorage.getItem(MEAL_LOGS_KEY);
      const all: Record<string, MealEntry[]> = json ? JSON.parse(json) : {};
      return all[date] || [];
    } catch (e) {
      console.error('Error al cargar comidas:', e);
      return [];
    }
  },

  async saveMealEntry(date: string, meal: MealEntry): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(MEAL_LOGS_KEY);
      const all: Record<string, MealEntry[]> = json ? JSON.parse(json) : {};
      if (!all[date]) all[date] = [];
      all[date].push(meal);
      await AsyncStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Error al guardar comida:', e);
      return false;
    }
  },

  async deleteMealEntry(date: string, mealId: string): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(MEAL_LOGS_KEY);
      const all: Record<string, MealEntry[]> = json ? JSON.parse(json) : {};
      if (all[date]) {
        all[date] = all[date].filter(m => m.id !== mealId);
        await AsyncStorage.setItem(MEAL_LOGS_KEY, JSON.stringify(all));
      }
      return true;
    } catch (e) {
      console.error('Error al eliminar comida:', e);
      return false;
    }
  },

  // ─── Water Tracking ─────────────────────────────────────────────

  async getWaterLog(date: string): Promise<WaterLog | null> {
    try {
      const json = await AsyncStorage.getItem(WATER_LOGS_KEY);
      const all: Record<string, WaterLog> = json ? JSON.parse(json) : {};
      return all[date] || null;
    } catch (e) {
      console.error('Error al cargar agua:', e);
      return null;
    }
  },

  async saveWaterLog(log: WaterLog): Promise<boolean> {
    try {
      const json = await AsyncStorage.getItem(WATER_LOGS_KEY);
      const all: Record<string, WaterLog> = json ? JSON.parse(json) : {};
      all[log.date] = log;
      await AsyncStorage.setItem(WATER_LOGS_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.error('Error al guardar agua:', e);
      return false;
    }
  },

  // ─── Workout Calories Integration ───────────────────────────────

  async getTodayWorkoutCalories(): Promise<number> {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const history = await this.getWorkoutHistory();
      const todaySessions = history.filter(s => s.date === todayStr);
      return todaySessions.reduce((sum, s) => sum + (s.estimatedCaloriesBurned || 0), 0);
    } catch {
      return 0;
    }
  },

  // ─── Gemini API Key ────────────────────────────────────────────

  async getGeminiApiKey(): Promise<string> {
    try {
      const val = await AsyncStorage.getItem('@gemini_api_key_v1');
      return val || '';
    } catch { return ''; }
  },

  async saveGeminiApiKey(key: string): Promise<boolean> {
    try {
      await AsyncStorage.setItem('@gemini_api_key_v1', key);
      return true;
    } catch { return false; }
  },

  // ─── Weight History ─────────────────────────────────────────────

  async getWeightHistory(): Promise<WeightEntry[]> {
    try {
      const json = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY);
      return json ? JSON.parse(json) : [];
    } catch (e) {
      console.error('Error al cargar historial de peso:', e);
      return [];
    }
  },

  async saveWeightEntry(entry: WeightEntry): Promise<boolean> {
    try {
      const history = await this.getWeightHistory();
      const existingIndex = history.findIndex(e => e.date === entry.date);
      if (existingIndex >= 0) {
        history[existingIndex] = entry;
      } else {
        history.push(entry);
      }
      await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(history));
      return true;
    } catch (e) {
      console.error('Error al guardar peso:', e);
      return false;
    }
  },

  // ─── Theme Preference ──────────────────────────────────────────

  async getTheme(): Promise<ThemeMode> {
    try {
      const value = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      return (value as ThemeMode) || 'dark';
    } catch (e) {
      return 'dark';
    }
  },

  async saveTheme(mode: ThemeMode): Promise<boolean> {
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, mode);
      return true;
    } catch (e) {
      console.error('Error al guardar tema:', e);
      return false;
    }
  },
};

