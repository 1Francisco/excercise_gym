import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import Colors from '../constants/Colors';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonCardProps {
  height?: number;
  lines?: number;
  style?: any;
}

export default function SkeletonCard({ height = 80, lines = 2, style }: SkeletonCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[styles.card, { height }, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Animated.View
          key={i}
          style={[styles.line, { width: i === lines - 1 ? '60%' : '100%', opacity }]}
        />
      ))}
    </View>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      padding: 16,
      justifyContent: 'center',
      gap: 10,
      marginBottom: 12,
    },
    line: {
      height: 14,
      backgroundColor: colors.cardBorder,
      borderRadius: 7,
    },
  });
}
