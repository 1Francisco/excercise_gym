import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Exercise, SetEntry, ExerciseProgress, WorkoutSession, RoutineExercise } from '../types/exercise';
import { storage } from '../services/storage';
import { exercises } from './useExerciseFilter';
import { notifyRestEnd } from '../utils/notifications';

const DEFAULT_REST_TIME = 30;

export default function useWorkoutRunner() {
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_REST_TIME);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isDoNotDisturb, setIsDoNotDisturb] = useState<boolean>(false);

  const [currentSets, setCurrentSets] = useState<SetEntry[]>([]);
  const [completedProgress, setCompletedProgress] = useState<Record<string, ExerciseProgress>>({});
  const [personalRecords, setPersonalRecords] = useState<Record<string, SetEntry>>({});
  const [exerciseConfigs, setExerciseConfigs] = useState<Record<string, RoutineExercise>>({});

  const workoutStartRef = useRef<string>('');
  const exerciseStartRef = useRef<string>('');
  const timerRef = useRef<any>(null);
  const isDoNotDisturbRef = useRef(false);
  isDoNotDisturbRef.current = isDoNotDisturb;

  useEffect(() => {
    async function loadActiveWorkout() {
      const savedIds = await storage.getActiveWorkout();
      if (savedIds && savedIds.length > 0) {
        setExerciseIds(savedIds);
        setIsActive(true);
        workoutStartRef.current = new Date().toISOString();

        const savedProgress = await storage.getWorkoutProgress();
        if (savedProgress) {
          setCurrentIndex(savedProgress.currentIndex);
          setIsResting(savedProgress.isResting);
          setIsPaused(savedProgress.isPaused);
          setTimeRemaining(savedProgress.timeRemaining);
        }

        const configs = await storage.getWorkoutExerciseConfig();
        if (configs) {
          setExerciseConfigs(
            configs.reduce((acc, c) => ({ ...acc, [c.exerciseId]: c }), {})
          );
        }
      }
    }
    loadActiveWorkout();
    loadPRs();
  }, []);

  async function loadPRs() {
    const records = await storage.getPersonalRecords();
    setPersonalRecords(records);
  }

  // Load saved sets when changing exercises
  useEffect(() => {
    if (isActive && !isResting && exerciseIds[currentIndex]) {
      exerciseStartRef.current = new Date().toISOString();
      const saved = completedProgress[exerciseIds[currentIndex]];
      if (saved) {
        setCurrentSets(saved.sets.map((s, i) => ({ ...s, setNumber: i + 1 })));
      } else {
        setCurrentSets([]);
      }
    }
  }, [currentIndex, isResting, isActive]);

  const persistProgress = useCallback(async (index: number, resting: boolean, paused: boolean, time: number) => {
    await storage.saveWorkoutProgress({ currentIndex: index, isResting: resting, isPaused: paused, timeRemaining: time });
  }, []);

  const workoutExercises = useMemo(() => {
    return exerciseIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [exerciseIds]);

  const currentExercise = workoutExercises[currentIndex] || null;

  const getRestTimeForExercise = useCallback(
    (exId: string) => exerciseConfigs[exId]?.restTime ?? DEFAULT_REST_TIME,
    [exerciseConfigs]
  );

  const currentRestTime = currentExercise
    ? getRestTimeForExercise(currentExercise.id)
    : DEFAULT_REST_TIME;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && isResting && !isPaused) {
      setTimeRemaining(currentRestTime);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            notifyRestEnd(isDoNotDisturbRef.current);
            setIsResting(false);
            persistProgress(currentIndex, false, isPaused, DEFAULT_REST_TIME);
            return DEFAULT_REST_TIME;
          }
          const newTime = prev - 1;
          persistProgress(currentIndex, true, isPaused, newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => clearTimer();
  }, [isActive, isResting, isPaused, clearTimer, currentIndex, persistProgress, currentRestTime]);

  // ─── Set Management ────────────────────────────────────────

  const addSet = useCallback(() => {
    setCurrentSets((prev) => [
      ...prev,
      { setNumber: prev.length + 1, reps: 0, weight: 0, completed: false },
    ]);
  }, []);

  const updateSet = useCallback((setNumber: number, field: keyof SetEntry, value: number | boolean) => {
    setCurrentSets((prev) =>
      prev.map((s) => (s.setNumber === setNumber ? { ...s, [field]: value } : s))
    );
  }, []);

  const removeSet = useCallback((setNumber: number) => {
    setCurrentSets((prev) =>
      prev.filter((s) => s.setNumber !== setNumber).map((s, i) => ({ ...s, setNumber: i + 1 }))
    );
  }, []);

  // ─── Save Current Exercise & Check PRs ────────────────────

  const saveCurrentExercise = useCallback(async () => {
    const exId = exerciseIds[currentIndex];
    if (!exId) return;

    const completedSets = currentSets.filter((s) => s.completed);
    const progress: ExerciseProgress = {
      exerciseId: exId,
      sets: completedSets,
      startTime: exerciseStartRef.current,
      endTime: new Date().toISOString(),
    };

    setCompletedProgress((prev) => ({ ...prev, [exId]: progress }));

    if (completedSets.length > 0) {
      await storage.saveExerciseProgress(exId, progress);
      for (const set of completedSets) {
        const prevPr = personalRecords[exId];
        const isPr = !prevPr || set.weight > prevPr.weight || (set.weight === prevPr.weight && set.reps > prevPr.reps);
        if (isPr) {
          await storage.savePersonalRecord(exId, set);
          setPersonalRecords((prev) => ({ ...prev, [exId]: set }));
        }
      }
    }
  }, [currentIndex, exerciseIds, currentSets, personalRecords]);

  // ─── Workout Actions ───────────────────────────────────────

  const startWorkout = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setExerciseIds(ids);
    setCurrentIndex(0);
    setIsResting(false);
    setIsPaused(false);
    setIsActive(true);
    setCurrentSets([]);
    setCompletedProgress({});
    workoutStartRef.current = new Date().toISOString();
    await storage.saveActiveWorkout(ids);
    await storage.saveWorkoutProgress({ currentIndex: 0, isResting: false, isPaused: false, timeRemaining: DEFAULT_REST_TIME });
  }, []);

  const pauseWorkout = useCallback(() => {
    setIsPaused(true);
    clearTimer();
    persistProgress(currentIndex, isResting, true, timeRemaining);
  }, [clearTimer, currentIndex, isResting, timeRemaining, persistProgress]);

  const resumeWorkout = useCallback(() => {
    setIsPaused(false);
    persistProgress(currentIndex, isResting, false, timeRemaining);
  }, [currentIndex, isResting, timeRemaining, persistProgress]);

  const nextStep = useCallback(async () => {
    clearTimer();
    if (isResting) {
      setIsResting(false);
      persistProgress(currentIndex, false, isPaused, DEFAULT_REST_TIME);
      return;
    }

    await saveCurrentExercise();

    if (currentIndex < workoutExercises.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextExId = workoutExercises[nextIndex]?.id;
      const nextRestTime = nextExId ? getRestTimeForExercise(nextExId) : DEFAULT_REST_TIME;
      setIsResting(true);
      setCurrentIndex(nextIndex);
      persistProgress(nextIndex, true, isPaused, nextRestTime);
    } else {
      await finishWorkout();
    }
  }, [currentIndex, isResting, isPaused, workoutExercises, clearTimer, persistProgress, saveCurrentExercise, getRestTimeForExercise]);

  const prevStep = useCallback(async () => {
    clearTimer();
    setIsResting(false);
    if (currentIndex > 0) {
      await saveCurrentExercise();
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      persistProgress(prevIndex, false, isPaused, DEFAULT_REST_TIME);
    }
  }, [currentIndex, isPaused, clearTimer, persistProgress, saveCurrentExercise]);

  const skipRest = useCallback(() => {
    clearTimer();
    setIsResting(false);
    persistProgress(currentIndex, false, isPaused, DEFAULT_REST_TIME);
  }, [currentIndex, isPaused, clearTimer, persistProgress]);

  const addRestTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => {
      const newTime = prev + seconds;
      persistProgress(currentIndex, isResting, isPaused, newTime);
      return newTime;
    });
  }, [currentIndex, isResting, isPaused, persistProgress]);

  const toggleDoNotDisturb = useCallback(() => {
    setIsDoNotDisturb((prev) => !prev);
  }, []);

  async function finishWorkout() {
    clearTimer();
    const allExercises = { ...completedProgress };

    // Also save the current exercise if it has sets
    const exId = exerciseIds[currentIndex];
    if (exId && currentSets.some((s) => s.completed)) {
      const completedSets = currentSets.filter((s) => s.completed);
      allExercises[exId] = {
        exerciseId: exId,
        sets: completedSets,
        startTime: exerciseStartRef.current,
        endTime: new Date().toISOString(),
      };
    }

    const totalSets = Object.values(allExercises).reduce((sum, e) => sum + e.sets.length, 0);

    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      startTime: workoutStartRef.current,
      endTime: new Date().toISOString(),
      totalExercises: exerciseIds.length,
      totalSets,
      exercises: Object.values(allExercises),
      estimatedCaloriesBurned: Math.round(totalSets * 5 * (exerciseIds.length > 6 ? 1.2 : 1.0) * 0.7),
    };

    await storage.saveWorkoutSession(session);
    await storage.clearActiveWorkout();

    setIsActive(false);
    setExerciseIds([]);
    setCurrentIndex(0);
    setIsResting(false);
    setCurrentSets([]);
    setCompletedProgress({});
  }

  const endWorkout = useCallback(async () => {
    clearTimer();
    await finishWorkout();
  }, [clearTimer, currentIndex, currentSets, exerciseIds, completedProgress, workoutExercises]);

  // ─── PR Check for display ──────────────────────────────────

  const isPrSet = useCallback(
    (set: SetEntry): boolean => {
      if (!currentExercise) return false;
      const pr = personalRecords[currentExercise.id];
      if (!pr) return set.completed && set.weight > 0;
      return (
        set.completed &&
        (set.weight > pr.weight || (set.weight === pr.weight && set.reps > pr.reps))
      );
    },
    [currentExercise, personalRecords]
  );

  return {
    isActive,
    isPaused,
    isResting,
    isDoNotDisturb,
    toggleDoNotDisturb,
    timeRemaining,
    currentIndex,
    totalExercises: workoutExercises.length,
    workoutExercises,
    currentExercise,
    nextExercise: workoutExercises[currentIndex + 1] || null,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    nextStep,
    prevStep,
    skipRest,
    addRestTime,
    endWorkout,
    currentSets,
    addSet,
    updateSet,
    removeSet,
    isPrSet,
    totalVolume: currentSets
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.reps * s.weight, 0),
  };
}
