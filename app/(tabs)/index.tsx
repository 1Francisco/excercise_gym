import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import useExerciseFilter from '../../src/hooks/useExerciseFilter';
import ExerciseCard from '../../src/components/ExerciseCard';
import RoutineSuggestion from '../../src/components/RoutineSuggestion';
import { Search, X, Dumbbell } from 'lucide-react-native';
import { translateMuscle, translateEquipment } from '../../src/constants/Translations';

export default function CatalogScreen() {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data is local JSON — simulate brief refresh for UX consistency
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
        <Text style={styles.resultsText}>
          {filteredExercises.length} ejercicios encontrados
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={handleResetFilters}>
            <Text style={styles.resetText}>Limpiar</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
});
}
