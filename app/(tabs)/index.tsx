import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import useExerciseFilter from '../../src/hooks/useExerciseFilter';
import ExerciseCard from '../../src/components/ExerciseCard';
import RoutineSuggestion from '../../src/components/RoutineSuggestion';
import { Search, X, Dumbbell, PlusCircle, User } from 'lucide-react-native';
import { translateMuscle, translateEquipment } from '../../src/constants/Translations';
import { storage } from '../../src/services/storage';
import type { CustomExercise } from '../../src/types/exercise';

export default function CatalogScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);

  const loadCustom = () => storage.getCustomExercises().then(setCustomExercises);

  useEffect(() => { loadCustom(); }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCustom();
    setTimeout(() => setRefreshing(false), 300);
  }, []);

  const {
    searchQuery,
    setSearchQuery,
    selectedBodyPart,
    setSelectedBodyPart,
    selectedEquipment,
    setSelectedEquipment,
    filteredExercises,
    bodyPartsList,
    equipmentsList,
  } = useExerciseFilter();

  const filteredCustom = useMemo(() => {
    return customExercises.filter((ex) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!ex.name.toLowerCase().includes(q) && !ex.bodyPart.toLowerCase().includes(q) && !ex.equipment.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (selectedBodyPart && ex.bodyPart !== selectedBodyPart) return false;
      if (selectedEquipment && ex.equipment !== selectedEquipment) return false;
      return true;
    });
  }, [customExercises, searchQuery, selectedBodyPart, selectedEquipment]);

  const allExercises = useMemo(() => [...filteredCustom, ...filteredExercises], [filteredCustom, filteredExercises]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedBodyPart(null);
    setSelectedEquipment(null);
  };

  const hasActiveFilters = searchQuery !== '' || selectedBodyPart !== null || selectedEquipment !== null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar ejercicio, músculo..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCorrect={false}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearSearchIcon}>
              <X size={16} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters Section */}
      <View style={styles.filtersSection}>
        {/* Muscle Groups Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterTitle}>Grupo Muscular</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContainer}
          >
            <Pressable
              onPress={() => setSelectedBodyPart(null)}
              style={[styles.chip, !selectedBodyPart && styles.chipActive]}
            >
              <Text style={[styles.chipText, !selectedBodyPart && styles.chipTextActive]}>Todos</Text>
            </Pressable>
            {bodyPartsList.map((part) => (
              <Pressable
                key={part}
                onPress={() => setSelectedBodyPart(part)}
                style={[styles.chip, selectedBodyPart === part && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedBodyPart === part && styles.chipTextActive]}>
                  {translateMuscle(part)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Equipment Filter */}
        <View style={styles.filterGroup}>
          <Text style={styles.filterTitle}>Equipamiento</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScrollContainer}
          >
            <Pressable
              onPress={() => setSelectedEquipment(null)}
              style={[styles.chip, !selectedEquipment && styles.chipActive]}
            >
              <Text style={[styles.chipText, !selectedEquipment && styles.chipTextActive]}>Todos</Text>
            </Pressable>
            {equipmentsList.map((equip) => (
              <Pressable
                key={equip}
                onPress={() => setSelectedEquipment(equip)}
                style={[styles.chip, selectedEquipment === equip && styles.chipActive]}
              >
                <Text style={[styles.chipText, selectedEquipment === equip && styles.chipTextActive]}>
                  {translateEquipment(equip)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      <RoutineSuggestion />

      {/* Exercises List */}
      <View style={styles.listHeader}>
        <View style={styles.listHeaderLeft}>
          <Text style={styles.resultsText}>
            {allExercises.length} ejercicios
          </Text>
          <Pressable onPress={() => router.push('/exercise/create')} style={styles.createInlineBtn}>
            <PlusCircle size={14} color={colors.primary} />
            <Text style={styles.createInlineText}>Crear</Text>
          </Pressable>
        </View>
        {hasActiveFilters && (
          <Pressable onPress={handleResetFilters}>
            <Text style={styles.resetText}>Limpiar</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={allExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isCustom = item.id.startsWith('custom_');
          if (isCustom) {
            const ce = item as CustomExercise;
            return (
              <View style={styles.customCard}>
                <View style={styles.customCardInner}>
                  {ce.imageUri ? (
                    <Image source={{ uri: ce.imageUri }} style={styles.customThumbnail} />
                  ) : (
                    <View style={[styles.customThumbnail, styles.customThumbnailPlaceholder]}>
                      <User size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.infoContainer}>
                    <View style={styles.customBadgeRow}>
                      <View style={styles.customBadge}>
                        <User size={10} color={colors.primary} />
                        <Text style={styles.customBadgeText}>Personalizado</Text>
                      </View>
                    </View>
                    <Text style={styles.name} numberOfLines={1}>{ce.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.bodyPartBadge]}>
                        <Text style={styles.badgeText}>{translateMuscle(ce.bodyPart)}</Text>
                      </View>
                      <View style={[styles.badge, styles.equipmentBadge]}>
                        <Text style={styles.badgeText}>{ce.equipment}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          }
          return <ExerciseCard exercise={item as any} />;
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        initialNumToRender={15}
        maxToRenderPerBatch={20}
        windowSize={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Dumbbell size={48} color={colors.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Sin resultados</Text>
            <Text style={styles.emptySubtitle}>
              Prueba a cambiar tus filtros de búsqueda o limpia los filtros.
            </Text>
            {hasActiveFilters && (
              <Pressable onPress={handleResetFilters} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Limpiar Filtros</Text>
              </Pressable>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

function createStyles(colors: typeof Colors.dark) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  createInlineText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  clearSearchIcon: {
    padding: 4,
  },
  filtersSection: {
    paddingBottom: 8,
  },
  filterGroup: {
    marginTop: 8,
  },
  filterTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  chipScrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '700',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  resultsText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  resetText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  customCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: 10,
    overflow: 'hidden',
  },
  customCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  customThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  customThumbnailPlaceholder: {
    backgroundColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  customBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  customBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
});
}
