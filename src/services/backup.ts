import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

const ALL_KEYS = [
  '@fitness_routines_v1',
  '@active_workout_state_v1',
  '@workout_progress_v1',
  '@workout_exercise_config_v1',
  '@workout_history_v1',
  '@exercise_progress_v1',
  '@personal_records_v1',
  '@meal_logs_v1',
  '@water_logs_v1',
  '@weight_history_v1',
  '@theme_preference_v1',
  '@nutrition_goal_v1',
  '@nutrition_logs_v1',
  '@gemini_api_key_v1',
  '@daily_reminder_v1',
];

export async function exportAllData(): Promise<boolean> {
  try {
    const data: Record<string, any> = {};
    for (const key of ALL_KEYS) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    }

    data['_exportedAt'] = new Date().toISOString();
    data['_version'] = '1.0.0';

    const json = JSON.stringify(data, null, 2);
    const fileName = `exercises_gym_backup_${new Date().toISOString().split('T')[0]}.json`;

    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(json);

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar datos de Exercises Gym',
      });
    }

    return true;
  } catch (e) {
    console.error('Error exporting data:', e);
    return false;
  }
}

export async function importAllData(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { success: false, message: 'Importación cancelada' };

    const docFile = result.assets[0];
    const importedFile = new File(docFile.uri);
    const content = importedFile.textSync();
    const data = JSON.parse(content);

    let importedCount = 0;
    for (const key of ALL_KEYS) {
      if (data[key] !== undefined) {
        await AsyncStorage.setItem(key, JSON.stringify(data[key]));
        importedCount++;
      }
    }

    return {
      success: true,
      message: `Se importaron ${importedCount} categorías de datos correctamente. Se recomienda reiniciar la app.`,
    };
  } catch (e) {
    return {
      success: false,
      message: `Error al importar: ${e instanceof Error ? e.message : 'Archivo inválido'}`,
    };
  }
}
