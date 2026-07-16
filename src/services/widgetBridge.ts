import { Platform } from 'react-native';

export async function updateWidgetWithWorkout(date: string, volume: number, exercisesCount: number) {
  if (Platform.OS !== 'android') return;

  try {
    const GymWidget = require('expo-modules-core').NativeModulesProxy.GymWidget;
    if (GymWidget?.updateGymWidget) {
      await GymWidget.updateGymWidget(date, String(volume), `${exercisesCount} ejercicios`, '');
    }
  } catch {
    // Widget module may not be available
  }
}

export async function updateGymWidget(date: string, volume: string, exercises: string, streak: string) {
  if (Platform.OS !== 'android') return;

  try {
    const GymWidget = require('expo-modules-core').NativeModulesProxy.GymWidget;
    if (GymWidget?.updateGymWidget) {
      await GymWidget.updateGymWidget(date, volume, exercises, streak);
    }
  } catch {
    // Widget module may not be available
  }
}

export async function updateProgressWidget(streak: string, monthlyWorkouts: string, todayCalories: string, weeklyBars: string) {
  if (Platform.OS !== 'android') return;

  try {
    const GymWidget = require('expo-modules-core').NativeModulesProxy.GymWidget;
    if (GymWidget?.updateProgressWidget) {
      await GymWidget.updateProgressWidget(streak, monthlyWorkouts, todayCalories, weeklyBars);
    }
  } catch {
    // Widget module may not be available
  }
}

export async function updateAllWidgets() {
  if (Platform.OS !== 'android') return;

  try {
    const GymWidget = require('expo-modules-core').NativeModulesProxy.GymWidget;
    if (GymWidget?.updateAllWidgets) {
      await GymWidget.updateAllWidgets();
    }
  } catch {
    // Widget module may not be available
  }
}
