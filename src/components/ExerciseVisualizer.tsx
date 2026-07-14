import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Colors from '../constants/Colors';
import { Dumbbell } from 'lucide-react-native';

interface ExerciseVisualizerProps {
  path: string; // The path from the JSON (e.g. 'images/0001-2gPfomN.jpg' or 'videos/0001-2gPfomN.gif')
  type: 'image' | 'gif';
  style?: any;
}

const BASE_MEDIA_URL = 'https://raw.githubusercontent.com/ievenight/exercises-dataset/master';

export default function ExerciseVisualizer({ path, type, style }: ExerciseVisualizerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Build the complete CDN URL for the media asset
  const mediaUrl = `${BASE_MEDIA_URL}/${path}`;

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Colors.dark.primary} />
        </View>
      )}

      {hasError ? (
        <View style={styles.errorContainer}>
          <Dumbbell size={40} color={Colors.dark.textMuted} />
        </View>
      ) : (
        <Image
          source={{ uri: mediaUrl }}
          style={styles.image}
          contentFit="contain"
          transition={300}
          cachePolicy="disk" // Keep images/GIFs cached on disk for offline capabilities
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}
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
