import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TextInput, Pressable, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { storage } from '../../src/services/storage';
import * as ImagePicker from 'expo-image-picker';
import type { BodyPart, CustomExercise } from '../../src/types/exercise';
import { Camera, Save, Trash2 } from 'lucide-react-native';

const BODY_PARTS: BodyPart[] = [
  'back', 'cardio', 'chest', 'lower arms', 'lower legs',
  'neck', 'shoulders', 'upper arms', 'upper legs', 'waist',
];

const EQUIPMENT = [
  'body weight', 'dumbbell', 'barbell', 'kettlebell', 'cable',
  'machine', 'band', 'medicine ball', 'other',
];

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },
    title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
    subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
    label: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    input: {
      backgroundColor: colors.card, borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder,
      color: colors.text, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder,
      backgroundColor: colors.card,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    chipTextActive: { color: colors.background },
    photoPreview: { width: '100%', height: 200, borderRadius: 12, marginTop: 8 },
    photoButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.primary, borderStyle: 'dashed',
    },
    photoButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
    deletePhotoBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 20, padding: 6 },
    saveButton: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 8,
    },
    saveButtonText: { color: colors.background, fontSize: 16, fontWeight: '700' },
  });
}

export default function CreateExerciseScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [bodyPart, setBodyPart] = useState<BodyPart>('chest');
  const [equipment, setEquipment] = useState('body weight');
  const [instructions, setInstructions] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre del ejercicio es obligatorio.');
      return;
    }

    const exercise: CustomExercise = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      bodyPart,
      equipment,
      instructions: instructions.trim(),
      imageUri: imageUri || undefined,
      createdAt: new Date().toISOString(),
    };

    const ok = await storage.saveCustomExercise(exercise);
    if (ok) {
      Alert.alert('Guardado', 'Ejercicio personalizado creado correctamente.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('Error', 'No se pudo guardar el ejercicio.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Nuevo Ejercicio</Text>
        <Text style={styles.subtitle}>Crea tu propio ejercicio personalizado con foto y descripción.</Text>

        <Text style={styles.label}>Nombre del Ejercicio</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Press militar con mancuerna" placeholderTextColor={colors.textMuted} />

        <Text style={styles.label}>Grupo Muscular</Text>
        <View style={styles.chipRow}>
          {BODY_PARTS.map((bp) => (
            <Pressable key={bp} onPress={() => setBodyPart(bp)} style={[styles.chip, bodyPart === bp && styles.chipActive]}>
              <Text style={[styles.chipText, bodyPart === bp && styles.chipTextActive]}>{bp}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Equipo</Text>
        <View style={styles.chipRow}>
          {EQUIPMENT.map((eq) => (
            <Pressable key={eq} onPress={() => setEquipment(eq)} style={[styles.chip, equipment === eq && styles.chipActive]}>
              <Text style={[styles.chipText, equipment === eq && styles.chipTextActive]}>{eq}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Instrucciones</Text>
        <TextInput style={[styles.input, styles.textArea]} value={instructions} onChangeText={setInstructions} placeholder="Describe cómo realizar el ejercicio..." placeholderTextColor={colors.textMuted} multiline />

        <Text style={styles.label}>Foto (opcional)</Text>
        <Pressable onPress={pickImage} style={styles.photoButton}>
          <Camera size={18} color={colors.primary} />
          <Text style={styles.photoButtonText}>{imageUri ? 'Cambiar foto' : 'Tomar o seleccionar foto'}</Text>
        </Pressable>
        {imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} />
            <Pressable onPress={() => setImageUri(null)} style={styles.deletePhotoBtn}>
              <Trash2 size={16} color="#fff" />
            </Pressable>
          </View>
        )}

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Save size={20} color={colors.background} />
          <Text style={styles.saveButtonText}>Guardar Ejercicio</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
