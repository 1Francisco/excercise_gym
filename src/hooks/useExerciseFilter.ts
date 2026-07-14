import { useState, useMemo } from 'react';
import { Exercise, BodyPart } from '../types/exercise';
import exercisesRaw from '../constants/data/exercises.json';
import { translateExerciseName } from '../constants/Translations';

// Cast the imported raw json to the correct type
const exercises: Exercise[] = exercisesRaw as Exercise[];

export default function useExerciseFilter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  // Get unique list of body parts and equipment for filter chips
  const bodyPartsList = useMemo(() => {
    const parts = new Set<string>();
    exercises.forEach((item) => {
      if (item.body_part) parts.add(item.body_part);
    });
    return Array.from(parts).sort();
  }, []);

  const equipmentsList = useMemo(() => {
    const equips = new Set<string>();
    exercises.forEach((item) => {
      if (item.equipment) equips.add(item.equipment);
    });
    return Array.from(equips).sort();
  }, []);

  // Filter exercises based on query, body part, and equipment
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // 1. Filter by search query (case-insensitive name, target muscle or category)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const translatedName = translateExerciseName(exercise.name || '').toLowerCase();
        const matchesName = exercise.name?.toLowerCase().includes(query) || translatedName.includes(query);
        const matchesTarget = exercise.target?.toLowerCase().includes(query);
        const matchesCategory = exercise.category?.toLowerCase().includes(query);
        
        if (!matchesName && !matchesTarget && !matchesCategory) {
          return false;
        }
      }

      // 2. Filter by selected body part
      if (selectedBodyPart && exercise.body_part !== selectedBodyPart) {
        return false;
      }

      // 3. Filter by selected equipment
      if (selectedEquipment && exercise.equipment !== selectedEquipment) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedBodyPart, selectedEquipment]);

  return {
    searchQuery,
    setSearchQuery,
    selectedBodyPart,
    setSelectedBodyPart,
    selectedEquipment,
    setSelectedEquipment,
    filteredExercises,
    bodyPartsList,
    equipmentsList,
    totalCount: exercises.length,
  };
}
export { exercises };
