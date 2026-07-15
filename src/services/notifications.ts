import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATION_KEY = '@daily_reminder_v1';

export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return false;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return true;
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | undefined> {
  await cancelAllScheduled();

  const trigger = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
  } as Notifications.DailyTriggerInput;

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🏋️ ¡Hora de entrenar!',
      body: 'No olvides completar tu entrenamiento de hoy. ¡Tu cuerpo te lo agradecerá!',
      sound: true,
    },
    trigger,
  });

  await AsyncStorage.setItem(NOTIFICATION_KEY, JSON.stringify({ hour, minute, id }));
  return id;
}

export async function cancelAllScheduled() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
  await AsyncStorage.removeItem(NOTIFICATION_KEY);
}

export async function getSavedReminder(): Promise<{ hour: number; minute: number } | null> {
  try {
    const json = await AsyncStorage.getItem(NOTIFICATION_KEY);
    if (json) {
      const data = JSON.parse(json);
      return { hour: data.hour, minute: data.minute };
    }
  } catch {}
  return null;
}
