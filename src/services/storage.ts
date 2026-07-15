import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine } from '../types/exercise';

const ROUTINES_STORAGE_KEY = '@fitness_routines_v1';
const ACTIVE_WORKOUT_STORAGE_KEY = '@active_workout_state_v1';
const WORKOUT_PROGRESS_STORAGE_KEY = '@workout_progress_v1';

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
      return true;
    } catch (e) {
      console.error('Error al limpiar entrenamiento activo:', e);
      return false;
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
};

