import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Exercise } from '../types/exercise';
import { storage } from '../services/storage';
import { exercises } from './useExerciseFilter';

const DEFAULT_REST_TIME = 30;

export default function useWorkoutRunner() {
  const [exerciseIds, setExerciseIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(DEFAULT_REST_TIME);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Load any active workout from storage on mount
  useEffect(() => {
    async function loadActiveWorkout() {
      const savedIds = await storage.getActiveWorkout();
      if (savedIds && savedIds.length > 0) {
        setExerciseIds(savedIds);
        setIsActive(true);

        const savedProgress = await storage.getWorkoutProgress();
        if (savedProgress) {
          setCurrentIndex(savedProgress.currentIndex);
          setIsResting(savedProgress.isResting);
          setIsPaused(savedProgress.isPaused);
          setTimeRemaining(savedProgress.timeRemaining);
        }
      }
    }
    loadActiveWorkout();
  }, []);

  // Persist current progress on meaningful state changes
  const persistProgress = useCallback(async (index: number, resting: boolean, paused: boolean, time: number) => {
    await storage.saveWorkoutProgress({
      currentIndex: index,
      isResting: resting,
      isPaused: paused,
      timeRemaining: time,
    });
  }, []);

  // Map IDs to full exercise data
  const workoutExercises = useMemo(() => {
    return exerciseIds
      .map((id) => exercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => !!ex);
  }, [exerciseIds]);

  const currentExercise = workoutExercises[currentIndex] || null;

  // Clear timer interval
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Rest timer countdown effect
  useEffect(() => {
    if (isActive && isResting && !isPaused) {
      setTimeRemaining(DEFAULT_REST_TIME);

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
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
  }, [isActive, isResting, isPaused, clearTimer, currentIndex, persistProgress]);

  const startWorkout = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setExerciseIds(ids);
    setCurrentIndex(0);
    setIsResting(false);
    setIsPaused(false);
    setIsActive(true);
    await storage.saveActiveWorkout(ids);
    await storage.saveWorkoutProgress({
      currentIndex: 0,
      isResting: false,
      isPaused: false,
      timeRemaining: DEFAULT_REST_TIME,
    });
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

    if (currentIndex < workoutExercises.length - 1) {
      const nextIndex = currentIndex + 1;
      setIsResting(true);
      setCurrentIndex(nextIndex);
      persistProgress(nextIndex, true, isPaused, DEFAULT_REST_TIME);
    } else {
      setIsActive(false);
      setExerciseIds([]);
      setCurrentIndex(0);
      await storage.clearActiveWorkout();
    }
  }, [currentIndex, isResting, isPaused, workoutExercises.length, clearTimer, persistProgress]);

  const prevStep = useCallback(() => {
    clearTimer();
    setIsResting(false);
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      persistProgress(prevIndex, false, isPaused, DEFAULT_REST_TIME);
    }
  }, [currentIndex, isPaused, clearTimer, persistProgress]);

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

  const endWorkout = useCallback(async () => {
    clearTimer();
    setIsActive(false);
    setExerciseIds([]);
    setCurrentIndex(0);
    setIsResting(false);
    await storage.clearActiveWorkout();
  }, [clearTimer]);

  return {
    isActive,
    isPaused,
    isResting,
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
  };
}
