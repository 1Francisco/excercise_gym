import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Dumbbell } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ExerciseVisualizerProps {
  path: string;
  type: 'image' | 'gif';
  style?: any;
  priority?: 'low' | 'normal' | 'high';
}

const BASE_MEDIA_URL = 'https://raw.githubusercontent.com/ievenight/exercises-dataset/master';

export default function ExerciseVisualizer({ path, type, style, priority = 'normal' }: ExerciseVisualizerProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  const mediaUrl = `${BASE_MEDIA_URL}/${path}`;

  if (hasError) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Dumbbell size={40} color={colors.textMuted} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: mediaUrl }}
        style={styles.image}
        contentFit="contain"
        transition={500}
        cachePolicy="disk"
        priority={priority}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1c1c1e', // Subtle contrast background
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 28, 30, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#27272a',
  },
});
