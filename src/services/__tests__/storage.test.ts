import AsyncStorage from '@react-native-async-storage/async-storage';
import { storage } from '../storage';
import type { Routine, WorkoutSession } from '../../types/exercise';
import type { MealEntry } from '../../types/nutrition';

describe('storage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('Routines', () => {
    it('returns empty array when no routines saved', async () => {
      const routines = await storage.getRoutines();
      expect(routines).toEqual([]);
    });

    it('saves and retrieves a routine', async () => {
      const routine: Routine = {
        id: '1',
        name: 'Test Routine',
        exerciseIds: ['0001', '0002'],
        createdAt: new Date().toISOString(),
      };

      const saved = await storage.saveRoutine(routine);
      expect(saved).toBe(true);

      const routines = await storage.getRoutines();
      expect(routines).toHaveLength(1);
      expect(routines[0].name).toBe('Test Routine');
    });

    it('updates existing routine on second save', async () => {
      const routine: Routine = {
        id: '1',
        name: 'Original',
        exerciseIds: [],
        createdAt: new Date().toISOString(),
      };

      await storage.saveRoutine(routine);
      routine.name = 'Updated';
      await storage.saveRoutine(routine);

      const routines = await storage.getRoutines();
      expect(routines).toHaveLength(1);
      expect(routines[0].name).toBe('Updated');
    });

    it('deletes a routine', async () => {
      const routine: Routine = {
        id: '1',
        name: 'Delete Me',
        exerciseIds: [],
        createdAt: new Date().toISOString(),
      };

      await storage.saveRoutine(routine);
      expect(await storage.getRoutines()).toHaveLength(1);

      const deleted = await storage.deleteRoutine('1');
      expect(deleted).toBe(true);
      expect(await storage.getRoutines()).toHaveLength(0);
    });
  });

  describe('Workout History', () => {
    it('saves and retrieves workout sessions', async () => {
      const session: WorkoutSession = {
        id: 'session-1',
        date: '2026-07-15',
        startTime: '2026-07-15T10:00:00',
        endTime: '2026-07-15T11:00:00',
        totalExercises: 3,
        totalSets: 10,
        exercises: [],
        estimatedCaloriesBurned: 200,
      };

      await storage.saveWorkoutSession(session);
      const history = await storage.getWorkoutHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('session-1');
    });
  });

  describe('Calorie Goals', () => {
    it('returns null when no goal is saved', async () => {
      const goal = await storage.getCalorieGoal();
      expect(goal).toBeNull();
    });

    it('saves and retrieves a calorie goal', async () => {
      const goal = {
        calories: 2500,
        protein: 150,
        carbs: 300,
        fat: 60,
        goalType: 'mantener',
      };

      await storage.saveCalorieGoal(goal);
      const retrieved = await storage.getCalorieGoal();
      expect(retrieved).toEqual(goal);
    });
  });

  describe('Daily Logs', () => {
    it('returns empty object when no logs exist', async () => {
      const logs = await storage.getDailyLogs();
      expect(logs).toEqual({});
    });

    it('saves and retrieves a daily log', async () => {
      await storage.saveDailyLog('2026-07-15', 500, 70, 30, 60, 15);
      const logs = await storage.getDailyLogs();
      expect(logs['2026-07-15'].caloriesConsumed).toBe(500);
      expect(logs['2026-07-15'].weight).toBe(70);
    });

    it('accumulates calories on subsequent saves for same date', async () => {
      await storage.saveDailyLog('2026-07-15', 500);
      await storage.saveDailyLog('2026-07-15', 300);
      const logs = await storage.getDailyLogs();
      expect(logs['2026-07-15'].caloriesConsumed).toBe(300); // Last write wins
    });
  });

  describe('Personal Records', () => {
    it('saves and retrieves a personal record', async () => {
      const set = { setNumber: 1, reps: 10, weight: 100, completed: true };
      await storage.savePersonalRecord('0001', set);
      const records = await storage.getPersonalRecords();
      expect(records['0001']).toEqual(set);
    });

    it('returns empty object when no records exist', async () => {
      const records = await storage.getPersonalRecords();
      expect(records).toEqual({});
    });
  });

  describe('Meal Entries', () => {
    it('returns empty array for date with no meals', async () => {
      const meals = await storage.getMealsByDate('2026-07-15');
      expect(meals).toEqual([]);
    });

    it('saves and retrieves a meal entry', async () => {
      const meal: MealEntry = {
        id: 'meal-1',
        name: 'Pollo con arroz',
        mealType: 'lunch',
        calories: 650,
        protein: 40,
        carbs: 60,
        fat: 20,
        timestamp: new Date().toISOString(),
      };

      await storage.saveMealEntry('2026-07-15', meal);
      const meals = await storage.getMealsByDate('2026-07-15');
      expect(meals).toHaveLength(1);
      expect(meals[0].name).toBe('Pollo con arroz');
    });

    it('deletes a meal entry', async () => {
      const meal: MealEntry = {
        id: 'meal-1',
        name: 'Test Meal',
        mealType: 'breakfast',
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10,
        timestamp: new Date().toISOString(),
      };

      await storage.saveMealEntry('2026-07-15', meal);
      await storage.deleteMealEntry('2026-07-15', 'meal-1');
      const meals = await storage.getMealsByDate('2026-07-15');
      expect(meals).toHaveLength(0);
    });
  });

  describe('Water Tracking', () => {
    it('returns null for date with no water log', async () => {
      const log = await storage.getWaterLog('2026-07-15');
      expect(log).toBeNull();
    });

    it('saves and retrieves a water log', async () => {
      await storage.saveWaterLog({ date: '2026-07-15', glasses: 5, target: 8 });
      const log = await storage.getWaterLog('2026-07-15');
      expect(log?.glasses).toBe(5);
      expect(log?.target).toBe(8);
    });
  });

  describe('Weight History', () => {
    it('saves and retrieves weight entries', async () => {
      await storage.saveWeightEntry({ date: '2026-07-15', weight: 75.5 });
      const history = await storage.getWeightHistory();
      expect(history).toHaveLength(1);
      expect(history[0].weight).toBe(75.5);
    });

    it('updates existing weight entry for same date', async () => {
      await storage.saveWeightEntry({ date: '2026-07-15', weight: 75.5 });
      await storage.saveWeightEntry({ date: '2026-07-15', weight: 76.0 });
      const history = await storage.getWeightHistory();
      expect(history).toHaveLength(1);
      expect(history[0].weight).toBe(76.0);
    });
  });

  describe('Theme Preference', () => {
    it('returns dark as default theme', async () => {
      const theme = await storage.getTheme();
      expect(theme).toBe('dark');
    });

    it('saves and retrieves theme preference', async () => {
      await storage.saveTheme('light');
      const theme = await storage.getTheme();
      expect(theme).toBe('light');
    });
  });

  describe('Gemini API Key', () => {
    it('returns empty string when no key saved', async () => {
      const key = await storage.getGeminiApiKey();
      expect(key).toBe('');
    });

    it('saves and retrieves API key', async () => {
      await storage.saveGeminiApiKey('test-key-123');
      const key = await storage.getGeminiApiKey();
      expect(key).toBe('test-key-123');
    });
  });

  describe('Today Workout Calories', () => {
    it('returns 0 when no workouts today', async () => {
      const calories = await storage.getTodayWorkoutCalories();
      expect(calories).toBe(0);
    });

    it('sums estimatedCaloriesBurned from today sessions', async () => {
      const today = new Date().toISOString().split('T')[0];
      await storage.saveWorkoutSession({
        id: '1', date: today, startTime: '', endTime: '',
        totalExercises: 2, totalSets: 5, exercises: [], estimatedCaloriesBurned: 150,
      });
      await storage.saveWorkoutSession({
        id: '2', date: today, startTime: '', endTime: '',
        totalExercises: 1, totalSets: 3, exercises: [], estimatedCaloriesBurned: 80,
      });
      const calories = await storage.getTodayWorkoutCalories();
      expect(calories).toBe(230);
    });

    it('ignores sessions from other dates', async () => {
      await storage.saveWorkoutSession({
        id: '1', date: '2026-01-01', startTime: '', endTime: '',
        totalExercises: 1, totalSets: 1, exercises: [], estimatedCaloriesBurned: 999,
      });
      const calories = await storage.getTodayWorkoutCalories();
      expect(calories).toBe(0);
    });
  });

  describe('Custom Exercises', () => {
    it('saves and retrieves custom exercises', async () => {
      await storage.saveCustomExercise({
        id: 'custom_1', name: 'My Exercise', bodyPart: 'chest',
        equipment: 'dumbbell', instructions: 'Do it', createdAt: new Date().toISOString(),
      });
      const list = await storage.getCustomExercises();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('My Exercise');
    });

    it('deletes a custom exercise', async () => {
      await storage.saveCustomExercise({
        id: 'custom_1', name: 'Delete Me', bodyPart: 'back',
        equipment: 'body weight', instructions: '', createdAt: '',
      });
      await storage.deleteCustomExercise('custom_1');
      const list = await storage.getCustomExercises();
      expect(list).toHaveLength(0);
    });
  });

  describe('Active Workout', () => {
    it('saves and retrieves active workout IDs', async () => {
      await storage.saveActiveWorkout(['0001', '0002', '0003']);
      const ids = await storage.getActiveWorkout();
      expect(ids).toEqual(['0001', '0002', '0003']);
    });

    it('clears active workout', async () => {
      await storage.saveActiveWorkout(['0001']);
      await storage.clearActiveWorkout();
      const ids = await storage.getActiveWorkout();
      expect(ids).toBeNull();
    });
  });

  describe('Body Measurements', () => {
    it('saves and retrieves measurements', async () => {
      await storage.saveBodyMeasurement({ date: '2026-07-15', bodyFat: 15, waist: 80 });
      const list = await storage.getBodyMeasurements();
      expect(list).toHaveLength(1);
      expect(list[0].bodyFat).toBe(15);
    });

    it('deletes a measurement', async () => {
      await storage.saveBodyMeasurement({ date: '2026-07-15', bodyFat: 15 });
      await storage.deleteBodyMeasurement('2026-07-15');
      const list = await storage.getBodyMeasurements();
      expect(list).toHaveLength(0);
    });
  });
});
