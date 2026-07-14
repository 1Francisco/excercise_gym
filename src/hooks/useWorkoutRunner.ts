import { useState, useEffect, useRef, useCallback } from 'react';
import { Exercise } from '../types/exercise';
import { storage } from '../services/storage';
import { exercises } from './useExerciseFilter';

const DEFAULT_REST_TIME = 30; // 30 seconds rest by default

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
      }
    }
    loadActiveWorkout();
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
            setIsResting(false); // Move to next exercise
            return DEFAULT_REST_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearTimer();
  }, [isActive, isResting, isPaused, clearTimer]);

  const startWorkout = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setExerciseIds(ids);
    setCurrentIndex(0);
    setIsResting(false);
    setIsPaused(false);
    setIsActive(true);
    await storage.saveActiveWorkout(ids);
  }, []);

  const pauseWorkout = useCallback(() => {
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resumeWorkout = useCallback(() => {
    setIsPaused(false);
  }, []);

  const nextStep = useCallback(async () => {
    clearTimer();
    if (isResting) {
      // If we are currently resting, skip rest and show the exercise
      setIsResting(false);
      return;
    }

    // Otherwise, check if we have more exercises
    if (currentIndex < workoutExercises.length - 1) {
      // Go to rest period before next exercise
      setIsResting(true);
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Workout completed!
      setIsActive(false);
      setExerciseIds([]);
      setCurrentIndex(0);
      await storage.clearActiveWorkout();
    }
  }, [currentIndex, isResting, workoutExercises.length, clearTimer]);

  const prevStep = useCallback(() => {
    clearTimer();
    setIsResting(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, clearTimer]);

  const skipRest = useCallback(() => {
    clearTimer();
    setIsResting(false);
  }, [clearTimer]);

  const addRestTime = useCallback((seconds: number) => {
    setTimeRemaining((prev) => prev + seconds);
  }, []);

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

// Add missing useMemo import
import { useMemo } from 'react';
