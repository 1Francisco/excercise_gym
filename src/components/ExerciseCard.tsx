import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Exercise } from '../types/exercise';
import Colors from '../constants/Colors';
import ExerciseVisualizer from './ExerciseVisualizer';
import { ChevronRight } from 'lucide-react-native';
import { translateMuscle, translateEquipment, translateExerciseName } from '../constants/Translations';
import { useTheme } from '../contexts/ThemeContext';


interface ExerciseCardProps {
  exercise: Exercise;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function ExerciseCard({ exercise, onPress, rightElement }: ExerciseCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const CardContent = (
    <View style={styles.cardInner}>
      <ExerciseVisualizer
        path={exercise.image}
        type="image"
        style={styles.thumbnail}
      />
      <View style={styles.infoContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {translateExerciseName(exercise.name)}
        </Text>
        
        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.bodyPartBadge]}>
            <Text style={styles.badgeText}>{translateMuscle(exercise.body_part)}</Text>
          </View>
          <View style={[styles.badge, styles.equipmentBadge]}>
            <Text style={styles.badgeText}>{translateEquipment(exercise.equipment)}</Text>
          </View>
        </View>
      </View>
      
      {rightElement ? (
        <View style={styles.rightActionContainer}>{rightElement}</View>
      ) : (
        <ChevronRight size={18} color={colors.textMuted} style={styles.chevron} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        {CardContent}
      </Pressable>
    );
  }

  return (
    <Link href={`/exercise/${exercise.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        {CardContent}
      </Pressable>
    </Link>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      marginBottom: 10,
      overflow: 'hidden',
    },
    cardPressed: {
      backgroundColor: '#27272a',
      borderColor: colors.primary,
    },
    cardInner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
    },
    thumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
    },
    infoContainer: {
      flex: 1,
      marginLeft: 12,
      justifyContent: 'center',
    },
    name: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      textTransform: 'capitalize',
      marginBottom: 6,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    bodyPartBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    equipmentBadge: {
      backgroundColor: 'rgba(113, 113, 122, 0.2)',
    },
    badgeText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    chevron: {
      marginLeft: 8,
    },
    rightActionContainer: {
      marginLeft: 8,
    },
  });
}
