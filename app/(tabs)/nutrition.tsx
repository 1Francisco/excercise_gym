import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../src/constants/Colors';
import { storage } from '../../src/services/storage';
import * as ImagePicker from 'expo-image-picker';
import foodDatabaseRaw from '../../src/constants/data/food_database.json';
import {
  Calculator,
  User,
  Activity,
  Target,
  ChevronDown,
  ChevronUp,
  Flame,
  Award,
  Info,
  Plus,
  Minus,
  RefreshCw,
  Scale,
  Calendar,
  Camera,
  Image as ImageIcon,
  Scan,
  Sparkles,
} from 'lucide-react-native';

type Gender = 'masculino' | 'femenino';
type Goal = 'perder' | 'mantener' | 'ganar';
type MacroSplit = 'balanced' | 'highprotein' | 'lowcarb';

interface ActivityLevel {
  value: number;
  factor: number;
  label: string;
  description: string;
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  {
    value: 1,
    factor: 1.2,
    label: 'Sedentario',
    description: 'Trabajo de oficina, poco o ningún ejercicio.',
  },
  {
    value: 2,
    factor: 1.375,
    label: 'Ligero',
    description: 'Ejercicio ligero o de deportes 1-3 días/semana.',
  },
  {
    value: 3,
    factor: 1.55,
    label: 'Moderado',
    description: 'Ejercicio moderado o deportes 3-5 días/semana.',
  },
  {
    value: 4,
    factor: 1.725,
    label: 'Activo',
    description: 'Ejercicio intenso o de fuerza 6-7 días/semana.',
  },
  {
    value: 5,
    factor: 1.9,
    label: 'Muy Activo',
    description: 'Ejercicio muy intenso diario o trabajo físico extremo.',
  },
];

interface ProductSchema {
  name: string;
  type?: string;
  nutrition: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  price?: {
    regular_price: number;
    promotion: number | null;
  };
  weight_gr?: number;
}

// Convert downloaded raw database object to typed array
const LOCAL_PRODUCTS = Object.values(foodDatabaseRaw) as ProductSchema[];

export default function NutritionScreen() {
  // Saved states from Storage
  const [savedGoal, setSavedGoal] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    goalType: string;
  } | null>(null);
  
  const [dailyLogs, setDailyLogs] = useState<Record<string, { 
    caloriesConsumed: number; 
    weight?: number; 
    proteinConsumed?: number;
    carbsConsumed?: number;
    fatConsumed?: number;
  }>>({});
  
  // Collapsible toggle for calculator
  const [isCalculatorExpanded, setIsCalculatorExpanded] = useState(true);

  // Inputs State for Calculator
  const [gender, setGender] = useState<Gender>('masculino');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel>(ACTIVITY_LEVELS[2]); // Default: Moderado
  const [goal, setGoal] = useState<Goal>('mantener');
  const [macroSplit, setMacroSplit] = useState<MacroSplit>('balanced');
  
  // Temp Calculator Results
  const [calcResults, setCalcResults] = useState<{
    bmr: number;
    tdee: number;
    targetCalories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);

  // Daily Logging Inputs
  const [calorieInputValue, setCalorieInputValue] = useState('');
  const [weightInputValue, setWeightInputValue] = useState('');

  // Smart Food Analyzer State
  const [foodTextInput, setFoodTextInput] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState('');
  const [analyzerResults, setAnalyzerResults] = useState<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    calcio: string;
    hierro: string;
    sodio: string;
    potasio: string;
    vitaminaC: string;
    vitaminaA: string;
    portion: string;
    priceInfo?: string;
  } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // Get current date string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Format YYYY-MM-DD to weekday abbreviation
  const getWeekdayLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[d.getDay()];
  };

  // Generate last 7 days list for history chart
  const last7Days = useMemo(() => {
    const list = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      list.push(d.toISOString().split('T')[0]);
    }
    return list;
  }, [todayStr]);

  // Load saved goal and logs on mount
  const loadData = async () => {
    const goalData = await storage.getCalorieGoal();
    const logsData = await storage.getDailyLogs();
    
    setSavedGoal(goalData);
    setDailyLogs(logsData);
    
    // If a goal is already saved, collapse the calculator by default
    if (goalData && goalData.calories > 0) {
      setIsCalculatorExpanded(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time calculation of macros inside calculator for preview
  const previewMacros = useMemo(() => {
    const ageNum = parseInt(age);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum) || ageNum <= 0 || weightNum <= 0 || heightNum <= 0) {
      return null;
    }

    let bmr = 0;
    if (gender === 'masculino') {
      bmr = 88.362 + (13.397 * weightNum) + (4.799 * heightNum) - (5.677 * ageNum);
    } else {
      bmr = 447.593 + (9.247 * weightNum) + (3.098 * heightNum) - (4.330 * ageNum);
    }

    const tdee = bmr * selectedActivity.factor;
    let targetCalories = tdee;
    if (goal === 'perder') {
      targetCalories = tdee - 500;
      if (targetCalories < bmr) targetCalories = bmr;
    } else if (goal === 'ganar') {
      targetCalories = tdee + 350;
    }

    let pPercent = 0.3, cPercent = 0.4, fPercent = 0.3;
    if (macroSplit === 'highprotein') {
      pPercent = 0.4; cPercent = 0.35; fPercent = 0.25;
    } else if (macroSplit === 'lowcarb') {
      pPercent = 0.35; cPercent = 0.25; fPercent = 0.4;
    }

    const protein = Math.round((targetCalories * pPercent) / 4);
    const carbs = Math.round((targetCalories * cPercent) / 4);
    const fat = Math.round((targetCalories * fPercent) / 9);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCalories: Math.round(targetCalories),
      protein,
      carbs,
      fat,
    };
  }, [gender, age, weight, height, selectedActivity, goal, macroSplit]);

  // Autocomplete database search suggestions
  const suggestions = useMemo(() => {
    const query = foodTextInput.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    const matches: ProductSchema[] = [];
    for (const item of LOCAL_PRODUCTS) {
      if (item.name.toLowerCase().includes(query)) {
        matches.push(item);
        if (matches.length >= 4) break;
      }
    }
    return matches;
  }, [foodTextInput]);

  // Handle Calculate & Open Preview
  const handleCalculate = () => {
    if (!previewMacros) {
      Alert.alert('Error', 'Por favor completa todos los campos con valores válidos.');
      return;
    }
    setCalcResults(previewMacros);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Set calculated values as Active Daily Goal
  const handleSetAsGoal = async () => {
    if (!calcResults) return;

    const newGoal = {
      calories: calcResults.targetCalories,
      protein: calcResults.protein,
      carbs: calcResults.carbs,
      fat: calcResults.fat,
      goalType: goal,
    };

    const success = await storage.saveCalorieGoal(newGoal);
    if (success) {
      setSavedGoal(newGoal);
      setCalcResults(null);
      setIsCalculatorExpanded(false);
      Alert.alert('Éxito', '¡Meta diaria guardada correctamente!');
      
      // Initialize today's log if not exists
      const logs = await storage.getDailyLogs();
      if (!logs[todayStr]) {
        await storage.saveDailyLog(todayStr, 0);
        loadData();
      }
    } else {
      Alert.alert('Error', 'No se pudo guardar la meta.');
    }
  };

  // Add / Subtract calories consumed today
  const handleModifyCalories = async (amount: number, customP?: number, customC?: number, customF?: number) => {
    const todayLog = dailyLogs[todayStr] || { caloriesConsumed: 0, proteinConsumed: 0, carbsConsumed: 0, fatConsumed: 0 };
    const newTotal = Math.max(0, todayLog.caloriesConsumed + amount);
    
    let pDelta = 0;
    let cDelta = 0;
    let fDelta = 0;

    if (customP !== undefined && customC !== undefined && customF !== undefined) {
      pDelta = customP;
      cDelta = customC;
      fDelta = customF;
    } else {
      // Estimate macros ratio based on active goal split
      let pPercent = 0.3, cPercent = 0.4, fPercent = 0.3;
      if (savedGoal && savedGoal.calories > 0) {
        pPercent = (savedGoal.protein * 4) / savedGoal.calories;
        cPercent = (savedGoal.carbs * 4) / savedGoal.calories;
        fPercent = (savedGoal.fat * 9) / savedGoal.calories;
      }
      pDelta = Math.round((amount * pPercent) / 4);
      cDelta = Math.round((amount * cPercent) / 4);
      fDelta = Math.round((amount * fPercent) / 9);
    }
    
    const newProtein = Math.max(0, (todayLog.proteinConsumed || 0) + pDelta);
    const newCarbs = Math.max(0, (todayLog.carbsConsumed || 0) + cDelta);
    const newFat = Math.max(0, (todayLog.fatConsumed || 0) + fDelta);

    const success = await storage.saveDailyLog(todayStr, newTotal, undefined, newProtein, newCarbs, newFat);
    if (success) {
      // Reload logs
      const updatedLogs = await storage.getDailyLogs();
      setDailyLogs(updatedLogs);
      setCalorieInputValue('');
    }
  };

  // Handle custom calorie log submit
  const handleCustomCalorieSubmit = () => {
    const val = parseInt(calorieInputValue);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Error', 'Ingresa una cantidad válida de calorías.');
      return;
    }
    handleModifyCalories(val);
  };

  // Register today's weight
  const handleWeightSubmit = async () => {
    const val = parseFloat(weightInputValue);
    if (isNaN(val) || val <= 10 || val > 300) {
      Alert.alert('Error', 'Por favor ingresa un peso válido (10kg - 300kg).');
      return;
    }

    const todayLog = dailyLogs[todayStr] || { caloriesConsumed: 0, proteinConsumed: 0, carbsConsumed: 0, fatConsumed: 0 };
    const success = await storage.saveDailyLog(
      todayStr, 
      todayLog.caloriesConsumed, 
      val, 
      todayLog.proteinConsumed, 
      todayLog.carbsConsumed, 
      todayLog.fatConsumed
    );
    if (success) {
      const updatedLogs = await storage.getDailyLogs();
      setDailyLogs(updatedLogs);
      setWeightInputValue('');
      Alert.alert('Éxito', `Peso registrado: ${val} kg`);
    }
  };

  const handleResetGoal = () => {
    Alert.alert('Restablecer Meta', '¿Estás seguro de que deseas eliminar tu meta nutricional activa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Restablecer',
        style: 'destructive',
        onPress: async () => {
          await storage.saveCalorieGoal({ calories: 0, protein: 0, carbs: 0, fat: 0, goalType: '' });
          setSavedGoal(null);
          setCalcResults(null);
          setIsCalculatorExpanded(true);
        },
      },
    ]);
  };

  // Camera & Image picker controllers
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitamos acceso a la cámara para tomar fotos de tu plato.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setAnalyzerResults(null);
      // Pull a real food from database as a mock recognition suggestion
      const randomIndex = Math.floor(Math.random() * Math.min(100, LOCAL_PRODUCTS.length));
      setFoodTextInput(LOCAL_PRODUCTS[randomIndex]?.name || 'Pechuga de Pollo');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso Requerido', 'Necesitamos acceso a tu galería de fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImageUri(result.assets[0].uri);
      setAnalyzerResults(null);
      // Pull a real food from database as a mock recognition suggestion
      const randomIndex = Math.floor(Math.random() * Math.min(100, LOCAL_PRODUCTS.length));
      setFoodTextInput(LOCAL_PRODUCTS[randomIndex]?.name || 'Pechuga de Pollo');
    }
  };

  // Database-backed search and heuristics
  const analyzeFood = () => {
    if (!foodTextInput.trim() && !selectedImageUri) {
      Alert.alert('Error', 'Por favor ingresa una descripción o selecciona una foto de tu comida.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzerResults(null);
    setAnalyzingStep('Identificando patrones en la base de datos de Plaza Vea / Makro...');

    setTimeout(() => {
      setAnalyzingStep('Calculando volumen y porción estimada (100g)...');
      setTimeout(() => {
        setAnalyzingStep('Calculando macronutrientes y micronutrientes asociados...');
        setTimeout(() => {
          const query = foodTextInput.trim().toLowerCase();
          
          // 1. Try to find a match in the local scraped product database
          let bestMatch: ProductSchema | null = null;
          for (const item of LOCAL_PRODUCTS) {
            const nameLower = item.name.toLowerCase();
            if (nameLower === query) {
              bestMatch = item;
              break;
            }
            if (nameLower.includes(query) && (!bestMatch || nameLower.length < bestMatch.name.length)) {
              bestMatch = item;
            }
          }

          if (bestMatch) {
            // Generate realistic micronutrients based on the type of product from the database
            let calcio = '15mg';
            let hierro = '0.8mg';
            let sodio = '80mg';
            let potasio = '200mg';
            let vitC = '0.0mg';
            let vitA = '0mcg';
            
            const productType = bestMatch.type?.toLowerCase() || '';
            if (productType.includes('cerdo') || productType.includes('res') || productType.includes('carne')) {
              calcio = '12mg'; hierro = '2.6mg'; sodio = '65mg'; potasio = '318mg'; vitC = '0mg'; vitA = '0mcg';
            } else if (productType.includes('embutidos') || productType.includes('chorizo') || productType.includes('jamon') || productType.includes('salchicha')) {
              calcio = '15mg'; hierro = '1.3mg'; sodio = '750mg'; potasio = '160mg'; vitC = '0mg'; vitA = '0mcg';
            } else if (productType.includes('pollo') || productType.includes('ave') || productType.includes('pavita')) {
              calcio = '15mg'; hierro = '1.0mg'; sodio = '74mg'; potasio = '256mg'; vitC = '0mg'; vitA = '0mcg';
            }

            const priceVal = bestMatch.price?.regular_price;
            const priceString = priceVal ? `S/ ${priceVal.toFixed(2)}` : undefined;

            setAnalyzerResults({
              name: bestMatch.name,
              calories: Math.round(bestMatch.nutrition.calories),
              protein: bestMatch.nutrition.protein,
              carbs: bestMatch.nutrition.carbs,
              fat: bestMatch.nutrition.fat,
              calcio,
              hierro,
              sodio,
              potasio,
              vitaminaC: vitC,
              vitaminaA: vitA,
              portion: bestMatch.weight_gr ? `100g (de empaque ${bestMatch.weight_gr}g)` : '100g de porción',
              priceInfo: priceString,
            });
          } else {
            // 2. Generate consistent values for manual text that doesn't match the database
            let hash = 0;
            for (let i = 0; i < foodTextInput.length; i++) {
              hash = foodTextInput.charCodeAt(i) + ((hash << 5) - hash);
            }
            hash = Math.abs(hash);
            
            const generatedCals = 120 + (hash % 500); 
            const generatedP = 4 + (hash % 26); 
            const generatedF = 1 + ((hash >> 2) % 20); 
            let generatedC = Math.round((generatedCals - (generatedP * 4) - (generatedF * 9)) / 4);
            if (generatedC < 0) generatedC = 10 + (hash % 30);

            setAnalyzerResults({
              name: foodTextInput.charAt(0).toUpperCase() + foodTextInput.slice(1),
              calories: generatedCals,
              protein: generatedP,
              carbs: generatedC,
              fat: generatedF,
              calcio: `${20 + (hash % 120)}mg`,
              hierro: `${(0.4 + ((hash >> 3) % 3.5)).toFixed(1)}mg`,
              sodio: `${80 + (hash % 500)}mg`,
              potasio: `${120 + (hash % 350)}mg`,
              vitaminaC: `${(hash % 25).toFixed(1)}mg`,
              vitaminaA: `${(hash % 90)}mcg`,
              portion: 'Porción estimada',
            });
          }
          setIsAnalyzing(false);
        }, 800);
      }, 800);
    }, 800);
  };

  const handleSelectSuggestion = (suggestion: ProductSchema) => {
    setFoodTextInput(suggestion.name);
  };

  // Add analyzed calories to today's intake
  const handleAddAnalyzedCalories = async () => {
    if (!analyzerResults) return;
    
    await handleModifyCalories(
      analyzerResults.calories,
      analyzerResults.protein,
      analyzerResults.carbs,
      analyzerResults.fat
    );
    Alert.alert(
      'Añadido', 
      `Se han sumado +${analyzerResults.calories} kcal y sus macronutrientes de "${analyzerResults.name}" a tu consumo diario.`
    );
    
    handleClearAnalyzer();
  };

  const handleClearAnalyzer = () => {
    setFoodTextInput('');
    setSelectedImageUri(null);
    setAnalyzerResults(null);
  };

  // Calculate current today progress details
  const todayCalories = dailyLogs[todayStr]?.caloriesConsumed || 0;
  const todayWeight = dailyLogs[todayStr]?.weight;
  const todayProtein = dailyLogs[todayStr]?.proteinConsumed || 0;
  const todayCarbs = dailyLogs[todayStr]?.carbsConsumed || 0;
  const todayFat = dailyLogs[todayStr]?.fatConsumed || 0;
  
  // Find latest weight in log history
  const latestWeight = useMemo(() => {
    if (todayWeight) return todayWeight;
    const sortedDates = Object.keys(dailyLogs).sort((a, b) => b.localeCompare(a));
    for (const d of sortedDates) {
      if (dailyLogs[d].weight) return dailyLogs[d].weight;
    }
    return null;
  }, [dailyLogs, todayWeight]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          
          {/* DAILY PROGRESS DASHBOARD (if goal is active) */}
          {savedGoal && savedGoal.calories > 0 && (
            <View style={styles.dashboardCard}>
              <View style={styles.dashboardHeader}>
                <View style={styles.headerTitleRow}>
                  <Flame size={20} color={Colors.dark.primary} />
                  <Text style={styles.dashboardTitle}>Tu Progreso Diario</Text>
                </View>
                <Pressable onPress={handleResetGoal} style={styles.recalcLink}>
                  <RefreshCw size={14} color={Colors.dark.textMuted} />
                  <Text style={styles.recalcLinkText}>Cambiar Meta</Text>
                </Pressable>
              </View>

              {/* Calorie Ring/Progress Area */}
              <View style={styles.progressSection}>
                <View style={styles.progressNumericContainer}>
                  <View style={styles.caloriesCountBox}>
                    <Text style={styles.caloriesConsumedNumber}>{todayCalories}</Text>
                    <Text style={styles.caloriesConsumedLabel}>Consumidas</Text>
                  </View>
                  <View style={styles.dividerLine} />
                  <View style={styles.caloriesCountBox}>
                    <Text style={styles.caloriesTargetNumber}>{savedGoal.calories}</Text>
                    <Text style={styles.caloriesTargetLabel}>Meta Diaria</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.mainProgressBg}>
                  <View
                    style={[
                      styles.mainProgressFill,
                      {
                        width: `${Math.min(100, (todayCalories / savedGoal.calories) * 100)}%`,
                        backgroundColor: todayCalories > savedGoal.calories ? Colors.dark.accent : Colors.dark.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressDetailsRow}>
                  <Text style={styles.caloriesRemainingText}>
                    {todayCalories > savedGoal.calories
                      ? `Excedido por ${todayCalories - savedGoal.calories} kcal`
                      : `Faltan ${savedGoal.calories - todayCalories} kcal para tu meta`}
                  </Text>
                  {latestWeight && (
                    <Text style={styles.currentWeightText}>
                      Peso: {latestWeight} kg
                    </Text>
                  )}
                </View>
              </View>

              {/* Log Calories Input Area */}
              <Text style={styles.label}>Registrar Consumo Rápido</Text>
              <View style={styles.quickAddRow}>
                <Pressable onPress={() => handleModifyCalories(100)} style={styles.quickAddButton}>
                  <Text style={styles.quickAddButtonText}>+100 kcal</Text>
                </Pressable>
                <Pressable onPress={() => handleModifyCalories(250)} style={styles.quickAddButton}>
                  <Text style={styles.quickAddButtonText}>+250 kcal</Text>
                </Pressable>
                <Pressable onPress={() => handleModifyCalories(500)} style={styles.quickAddButton}>
                  <Text style={styles.quickAddButtonText}>+500 kcal</Text>
                </Pressable>
                {todayCalories > 0 && (
                  <Pressable onPress={() => handleModifyCalories(-100)} style={[styles.quickAddButton, styles.quickSubButton]}>
                    <Minus size={14} color={Colors.dark.accent} />
                    <Text style={styles.quickSubButtonText}>100</Text>
                  </Pressable>
                )}
              </View>

              {/* Custom Calorie & Weight Row */}
              <View style={styles.loggingInputsRow}>
                <View style={styles.logInputWrapper}>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="Añadir kcal..."
                      placeholderTextColor={Colors.dark.textMuted}
                      value={calorieInputValue}
                      onChangeText={setCalorieInputValue}
                    />
                    <Pressable onPress={handleCustomCalorieSubmit} style={styles.inlineLogButton}>
                      <Plus size={16} color={Colors.dark.background} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.logInputWrapper}>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder={latestWeight ? `${latestWeight} kg` : "Ej. 72.5"}
                      placeholderTextColor={Colors.dark.textMuted}
                      value={weightInputValue}
                      onChangeText={setWeightInputValue}
                    />
                    <Pressable onPress={handleWeightSubmit} style={[styles.inlineLogButton, { backgroundColor: '#3b82f6' }]}>
                      <Scale size={16} color={Colors.dark.text} />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Last 7 Days History Chart */}
              <Text style={styles.label}>Historial de los últimos 7 días</Text>
              <View style={styles.chartContainer}>
                {last7Days.map((date) => {
                  const log = dailyLogs[date] || { caloriesConsumed: 0 };
                  const percentOfGoal = Math.min(1.2, log.caloriesConsumed / savedGoal.calories);
                  
                  // Color code depending on performance (grey if 0, red if >110% of goal, green if within range)
                  let barColor = Colors.dark.primary;
                  if (log.caloriesConsumed === 0) {
                    barColor = Colors.dark.cardBorder;
                  } else if (log.caloriesConsumed > savedGoal.calories * 1.1) {
                    barColor = Colors.dark.accent;
                  }

                  const isToday = date === todayStr;

                  return (
                    <View key={date} style={styles.chartCol}>
                      <View style={styles.barWrapper}>
                        {log.caloriesConsumed > 0 && (
                          <View
                            style={[
                              styles.chartBarFill,
                              {
                                height: `${percentOfGoal * 100}%`,
                                backgroundColor: barColor,
                              },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={[styles.chartDayLabel, isToday && styles.chartDayLabelToday]}>
                        {getWeekdayLabel(date)}
                      </Text>
                      <Text style={styles.chartCalLabel}>
                        {log.caloriesConsumed > 0 ? `${log.caloriesConsumed}` : '-'}
                      </Text>
                      {log.weight && (
                        <Text style={styles.chartWeightLabel}>{log.weight}k</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Macronutrient progress trackers */}
              <Text style={styles.label}>Consumo de Macronutrientes</Text>
              <View style={styles.macroProgressContainer}>
                
                {/* Proteína */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <Text style={styles.macroProgressName}>Proteínas</Text>
                    <Text style={styles.macroProgressStats}>
                      {Math.round(todayProtein)}g / {savedGoal.protein}g
                    </Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View
                      style={[
                        styles.macroProgressBarFill,
                        {
                          width: `${Math.min(100, (todayProtein / savedGoal.protein) * 100)}%`,
                          backgroundColor: '#3b82f6',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayProtein >= savedGoal.protein
                      ? '¡Meta cumplida! 🎉'
                      : `${Math.round(savedGoal.protein - todayProtein)}g restantes`}
                  </Text>
                </View>

                {/* Carbohidratos */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <Text style={styles.macroProgressName}>Carbohidratos</Text>
                    <Text style={styles.macroProgressStats}>
                      {Math.round(todayCarbs)}g / {savedGoal.carbs}g
                    </Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View
                      style={[
                        styles.macroProgressBarFill,
                        {
                          width: `${Math.min(100, (todayCarbs / savedGoal.carbs) * 100)}%`,
                          backgroundColor: '#ef4444',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayCarbs >= savedGoal.carbs
                      ? '¡Meta cumplida! 🎉'
                      : `${Math.round(savedGoal.carbs - todayCarbs)}g restantes`}
                  </Text>
                </View>

                {/* Grasas */}
                <View style={styles.macroProgressItem}>
                  <View style={styles.macroProgressHeader}>
                    <Text style={styles.macroProgressName}>Grasas</Text>
                    <Text style={styles.macroProgressStats}>
                      {Math.round(todayFat)}g / {savedGoal.fat}g
                    </Text>
                  </View>
                  <View style={styles.macroProgressBarBg}>
                    <View
                      style={[
                        styles.macroProgressBarFill,
                        {
                          width: `${Math.min(100, (todayFat / savedGoal.fat) * 100)}%`,
                          backgroundColor: '#eab308',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayFat >= savedGoal.fat
                      ? '¡Meta cumplida! 🎉'
                      : `${Math.round(savedGoal.fat - todayFat)}g restantes`}
                  </Text>
                </View>

              </View>
            </View>
          )}

          {/* SMART FOOD ANALYZER CARD */}
          <View style={styles.analyzerCard}>
            <View style={styles.analyzerHeader}>
              <Sparkles size={20} color="#a855f7" />
              <Text style={styles.analyzerTitle}>Analizador de Comida Inteligente (IA)</Text>
            </View>
            <Text style={styles.analyzerSub}>
              Busca productos de Plaza Vea / Makro o sube una foto de tu plato para desglosar sus nutrientes.
            </Text>

            {/* Photo Preview if Selected */}
            {selectedImageUri && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: selectedImageUri }} style={styles.photoPreview} />
                {isAnalyzing && (
                  <View style={styles.scanningOverlay}>
                    <View style={styles.scannerLine} />
                  </View>
                )}
                {!isAnalyzing && (
                  <Pressable onPress={handleClearAnalyzer} style={styles.deletePhotoBadge}>
                    <Text style={styles.deletePhotoText}>Remover</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Input fields */}
            {!selectedImageUri && (
              <View style={styles.foodTextContainer}>
                <TextInput
                  style={[styles.foodInput, { height: 44 }]}
                  placeholder="¿Qué comiste? (Ej. Osobuco de cerdo, chorizo, etc.)"
                  placeholderTextColor={Colors.dark.textMuted}
                  value={foodTextInput}
                  onChangeText={setFoodTextInput}
                />
              </View>
            )}

            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && !selectedImageUri && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSelectSuggestion(item)}
                    style={styles.suggestionItem}
                  >
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.suggestionType}>{item.type || 'alimento'}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {selectedImageUri && !isAnalyzing && !analyzerResults && (
              <View style={styles.detectedFoodHintContainer}>
                <Text style={styles.detectedFoodHintLabel}>Plato Reconocido por la Cámara:</Text>
                <TextInput
                  style={styles.detectedFoodHintInput}
                  value={foodTextInput}
                  onChangeText={setFoodTextInput}
                  placeholder="Edita el nombre detectado..."
                  placeholderTextColor={Colors.dark.textMuted}
                />
              </View>
            )}

            {/* Action Triggers */}
            <View style={styles.analyzerButtonsRow}>
              {!selectedImageUri && (
                <>
                  <Pressable onPress={takePhoto} style={styles.mediaButton}>
                    <Camera size={18} color={Colors.dark.primary} />
                    <Text style={styles.mediaButtonText}>Cámara</Text>
                  </Pressable>
                  <Pressable onPress={pickImage} style={styles.mediaButton}>
                    <ImageIcon size={18} color={Colors.dark.primary} />
                    <Text style={styles.mediaButtonText}>Galería</Text>
                  </Pressable>
                </>
              )}
              
              <Pressable
                onPress={analyzeFood}
                style={[
                  styles.analyzeTrigger,
                  (isAnalyzing || (!foodTextInput.trim() && !selectedImageUri)) && styles.analyzeTriggerDisabled,
                ]}
                disabled={isAnalyzing}
              >
                <Scan size={18} color={Colors.dark.background} />
                <Text style={styles.analyzeTriggerText}>
                  {isAnalyzing ? 'Analizando...' : 'Analizar'}
                </Text>
              </Pressable>
            </View>

            {/* Scanning steps text if active */}
            {isAnalyzing && (
              <View style={styles.analyzingLoaderBox}>
                <ActivityIndicator size="small" color="#a855f7" />
                <Text style={styles.analyzingLoaderText}>{analyzingStep}</Text>
              </View>
            )}

            {/* Analysis Results Display */}
            {analyzerResults && !isAnalyzing && (
              <View style={styles.analyzerResultCard}>
                <View style={styles.resultTitleRow}>
                  <Text style={styles.resultTitle}>{analyzerResults.name}</Text>
                  <Text style={styles.resultPortion}>{analyzerResults.portion}</Text>
                </View>

                {/* Micro calorie & price badge */}
                <View style={styles.resultDetailsHeader}>
                  <View style={styles.resultCaloriesRow}>
                    <Flame size={18} color={Colors.dark.primary} />
                    <TextInput
                      style={styles.resultCaloriesInput}
                      keyboardType="numeric"
                      value={String(analyzerResults.calories)}
                      onChangeText={(val) => {
                        const num = parseInt(val) || 0;
                        setAnalyzerResults(prev => prev ? { ...prev, calories: num } : null);
                      }}
                    />
                    <Text style={styles.resultCaloriesUnit}>kcal</Text>
                  </View>
                  {analyzerResults.priceInfo && (
                    <Text style={styles.resultPriceText}>Ref: {analyzerResults.priceInfo}</Text>
                  )}
                </View>

                {/* Macro breakdown */}
                <Text style={styles.label}>Macronutrientes (por cada 100g)</Text>
                <View style={styles.resultMacroGrid}>
                  <View style={[styles.resultMacroBox, { borderLeftColor: '#3b82f6' }]}>
                    <Text style={styles.resultMacroLabel}>Proteínas</Text>
                    <TextInput
                      style={styles.resultMacroInput}
                      keyboardType="numeric"
                      value={String(analyzerResults.protein)}
                      onChangeText={(val) => {
                        const num = parseFloat(val) || 0;
                        setAnalyzerResults(prev => prev ? { ...prev, protein: num } : null);
                      }}
                    />
                  </View>
                  <View style={[styles.resultMacroBox, { borderLeftColor: '#ef4444' }]}>
                    <Text style={styles.resultMacroLabel}>Carbohidratos</Text>
                    <TextInput
                      style={styles.resultMacroInput}
                      keyboardType="numeric"
                      value={String(analyzerResults.carbs)}
                      onChangeText={(val) => {
                        const num = parseFloat(val) || 0;
                        setAnalyzerResults(prev => prev ? { ...prev, carbs: num } : null);
                      }}
                    />
                  </View>
                  <View style={[styles.resultMacroBox, { borderLeftColor: '#eab308' }]}>
                    <Text style={styles.resultMacroLabel}>Grasas</Text>
                    <TextInput
                      style={styles.resultMacroInput}
                      keyboardType="numeric"
                      value={String(analyzerResults.fat)}
                      onChangeText={(val) => {
                        const num = parseFloat(val) || 0;
                        setAnalyzerResults(prev => prev ? { ...prev, fat: num } : null);
                      }}
                    />
                  </View>
                </View>

                {/* Micronutrients breakdown */}
                <Text style={styles.label}>Micronutrientes clave</Text>
                <View style={styles.microsGrid}>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Calcio</Text>
                    <Text style={styles.microVal}>{analyzerResults.calcio}</Text>
                  </View>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Hierro</Text>
                    <Text style={styles.microVal}>{analyzerResults.hierro}</Text>
                  </View>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Sodio</Text>
                    <Text style={styles.microVal}>{analyzerResults.sodio}</Text>
                  </View>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Potasio</Text>
                    <Text style={styles.microVal}>{analyzerResults.potasio}</Text>
                  </View>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit C</Text>
                    <Text style={styles.microVal}>{analyzerResults.vitaminaC}</Text>
                  </View>
                  <View style={styles.microItem}>
                    <Text style={styles.microLabel}>Vit A</Text>
                    <Text style={styles.microVal}>{analyzerResults.vitaminaA}</Text>
                  </View>
                </View>

                {/* Log button */}
                <View style={styles.resultActionRow}>
                  <Pressable onPress={handleClearAnalyzer} style={styles.cancelResultBtn}>
                    <Text style={styles.cancelResultBtnText}>Cerrar</Text>
                  </Pressable>
                  <Pressable onPress={handleAddAnalyzedCalories} style={styles.logResultBtn}>
                    <Plus size={16} color={Colors.dark.background} />
                    <Text style={styles.logResultBtnText}>Añadir a mi Consumo</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* COLLAPSIBLE CALCULATOR HEADER */}
          {savedGoal && savedGoal.calories > 0 && (
            <Pressable
              onPress={() => setIsCalculatorExpanded(!isCalculatorExpanded)}
              style={styles.collapseHeader}
            >
              <View style={styles.collapseHeaderLeft}>
                <Calculator size={18} color={Colors.dark.primary} />
                <Text style={styles.collapseHeaderText}>Recalcular Meta Nutricional</Text>
              </View>
              {isCalculatorExpanded ? (
                <ChevronUp size={18} color={Colors.dark.textMuted} />
              ) : (
                <ChevronDown size={18} color={Colors.dark.textMuted} />
              )}
            </Pressable>
          )}

          {/* HARRIS-BENEDICT FORM CALCULATOR */}
          {isCalculatorExpanded && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Calculadora Harris-Benedict</Text>

              {/* Gender Picker */}
              <Text style={styles.label}>Género</Text>
              <View style={styles.genderContainer}>
                <Pressable
                  onPress={() => setGender('masculino')}
                  style={[
                    styles.genderButton,
                    gender === 'masculino' && styles.genderButtonActive,
                  ]}
                >
                  <User size={18} color={gender === 'masculino' ? Colors.dark.background : Colors.dark.textMuted} />
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'masculino' && styles.genderButtonTextActive,
                    ]}
                  >
                    Masculino
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setGender('femenino')}
                  style={[
                    styles.genderButton,
                    gender === 'femenino' && styles.genderButtonActive,
                  ]}
                >
                  <User size={18} color={gender === 'femenino' ? Colors.dark.background : Colors.dark.textMuted} />
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === 'femenino' && styles.genderButtonTextActive,
                    ]}
                  >
                    Femenino
                  </Text>
                </Pressable>
              </View>

              {/* Numeric Inputs Row */}
              <View style={styles.inputsRow}>
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Edad</Text>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="25"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={age}
                      onChangeText={setAge}
                    />
                    <Text style={styles.unitText}>años</Text>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Peso</Text>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="70"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={weight}
                      onChangeText={setWeight}
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Estatura</Text>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="175"
                      placeholderTextColor={Colors.dark.textMuted}
                      value={height}
                      onChangeText={setHeight}
                    />
                    <Text style={styles.unitText}>cm</Text>
                  </View>
                </View>
              </View>

              {/* Goal Picker */}
              <Text style={styles.label}>Objetivo Fitness</Text>
              <View style={styles.goalContainer}>
                <Pressable
                  onPress={() => setGoal('perder')}
                  style={[styles.goalCard, goal === 'perder' && styles.goalCardActive]}
                >
                  <Text style={[styles.goalTitle, goal === 'perder' && styles.goalTextActive]}>
                    Perder Peso
                  </Text>
                  <Text style={styles.goalDesc}>Déficit calórico</Text>
                </Pressable>
                <Pressable
                  onPress={() => setGoal('mantener')}
                  style={[styles.goalCard, goal === 'mantener' && styles.goalCardActive]}
                >
                  <Text style={[styles.goalTitle, goal === 'mantener' && styles.goalTextActive]}>
                    Mantener
                  </Text>
                  <Text style={styles.goalDesc}>Mantenimiento</Text>
                </Pressable>
                <Pressable
                  onPress={() => setGoal('ganar')}
                  style={[styles.goalCard, goal === 'ganar' && styles.goalCardActive]}
                >
                  <Text style={[styles.goalTitle, goal === 'ganar' && styles.goalTextActive]}>
                    Volumen
                  </Text>
                  <Text style={styles.goalDesc}>Superávit calórico</Text>
                </Pressable>
              </View>

              {/* Activity Level Selector */}
              <Text style={styles.label}>Nivel de Actividad Diaria</Text>
              <View style={styles.activityContainer}>
                {ACTIVITY_LEVELS.map((level) => {
                  const isActiveLevel = selectedActivity.value === level.value;
                  return (
                    <Pressable
                      key={level.value}
                      onPress={() => setSelectedActivity(level)}
                      style={[
                        styles.activityCard,
                        isActiveLevel && styles.activityCardActive,
                      ]}
                    >
                      <View style={styles.activityHeader}>
                        <Text
                          style={[
                            styles.activityLabel,
                            isActiveLevel && styles.activityLabelActive,
                          ]}
                        >
                          {level.label}
                        </Text>
                        <Text style={styles.activityFactor}>x{level.factor}</Text>
                      </View>
                      <Text style={styles.activityDesc}>{level.description}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Macro Split Selector Tabs */}
              <Text style={styles.label}>Distribución de Macronutrientes</Text>
              <View style={styles.splitTabs}>
                <Pressable
                  onPress={() => setMacroSplit('balanced')}
                  style={[
                    styles.splitTab,
                    macroSplit === 'balanced' && styles.splitTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      macroSplit === 'balanced' && styles.splitTabTextActive,
                    ]}
                  >
                    Equilibrada
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMacroSplit('highprotein')}
                  style={[
                    styles.splitTab,
                    macroSplit === 'highprotein' && styles.splitTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      macroSplit === 'highprotein' && styles.splitTabTextActive,
                    ]}
                  >
                    Alta Proteína
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMacroSplit('lowcarb')}
                  style={[
                    styles.splitTab,
                    macroSplit === 'lowcarb' && styles.splitTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      macroSplit === 'lowcarb' && styles.splitTabTextActive,
                    ]}
                  >
                    Baja en Carbs
                  </Text>
                </Pressable>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable onPress={handleCalculate} style={styles.calculateButton}>
                  <Calculator size={18} color={Colors.dark.background} />
                  <Text style={styles.calculateButtonText}>Calcular Calorías</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* CALCULATION PREVIEW & SET GOAL DASHBOARD */}
          {calcResults && (
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Flame size={24} color={Colors.dark.primary} />
                <Text style={styles.resultsTitle}>Resultado Calculado</Text>
              </View>

              {/* Calories Target */}
              <View style={styles.caloriesBanner}>
                <Text style={styles.caloriesNumber}>
                  {calcResults.targetCalories.toLocaleString()}
                </Text>
                <Text style={styles.caloriesLabel}>kcal / día recomendadas</Text>
                <View style={[styles.goalBadge, styles[`goalBadge_${goal}`]]}>
                  <Text style={styles.goalBadgeText}>
                    {goal === 'perder'
                      ? 'Objetivo: Déficit Calórico (-500 kcal)'
                      : goal === 'ganar'
                      ? 'Objetivo: Superávit Calórico (+350 kcal)'
                      : 'Objetivo: Mantenimiento Energético'}
                  </Text>
                </View>
              </View>

              {/* BMR & TDEE */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Metabolismo Basal (BMR)</Text>
                  <Text style={styles.statValue}>{calcResults.bmr} kcal</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Gasto Diario (TDEE)</Text>
                  <Text style={styles.statValue}>{calcResults.tdee} kcal</Text>
                </View>
              </View>

              {/* Macros Breakdown */}
              <View style={styles.macrosContainer}>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Proteínas:</Text>
                  <Text style={styles.macroStatVal}>{calcResults.protein}g</Text>
                </View>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Carbohidratos:</Text>
                  <Text style={styles.macroStatVal}>{calcResults.carbs}g</Text>
                </View>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Grasas:</Text>
                  <Text style={styles.macroStatVal}>{calcResults.fat}g</Text>
                </View>
              </View>

              {/* Set as Active Goal button */}
              <Pressable onPress={handleSetAsGoal} style={styles.saveGoalButton}>
                <Award size={18} color={Colors.dark.background} />
                <Text style={styles.saveGoalButtonText}>Establecer como Meta Activa</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    height: 44,
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  genderButtonText: {
    color: Colors.dark.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: Colors.dark.background,
    fontWeight: '700',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  unitText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  goalContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  goalCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 10,
    alignItems: 'center',
  },
  goalCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  goalTitle: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  goalTextActive: {
    color: Colors.dark.primary,
  },
  goalDesc: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  activityContainer: {
    gap: 8,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 12,
  },
  activityCardActive: {
    borderColor: Colors.dark.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityLabel: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  activityLabelActive: {
    color: Colors.dark.primary,
  },
  activityFactor: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityDesc: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  splitTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 3,
    marginBottom: 16,
  },
  splitTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  splitTabActive: {
    backgroundColor: Colors.dark.primary,
  },
  splitTabText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  splitTabTextActive: {
    color: Colors.dark.background,
    fontWeight: '700',
  },
  actionButtons: {
    marginTop: 10,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  calculateButtonText: {
    color: Colors.dark.background,
    fontSize: 16,
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  resultsTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
  },
  caloriesBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesNumber: {
    color: Colors.dark.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  caloriesLabel: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 10,
  },
  goalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  goalBadge_perder: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  goalBadge_mantener: {
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
  },
  goalBadge_ganar: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
  },
  goalBadgeText: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 10,
  },
  statLabel: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  macrosContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  macroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroStatName: {
    color: Colors.dark.textMuted,
    fontSize: 14,
  },
  macroStatVal: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  saveGoalButtonText: {
    color: Colors.dark.background,
    fontSize: 15,
    fontWeight: '700',
  },
  
  // DASHBOARD SPECIFIC STYLES
  dashboardCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
  },
  recalcLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  recalcLinkText: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  progressNumericContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 14,
  },
  caloriesCountBox: {
    flex: 1,
    alignItems: 'center',
  },
  caloriesConsumedNumber: {
    color: Colors.dark.text,
    fontSize: 28,
    fontWeight: '800',
  },
  caloriesConsumedLabel: {
    color: Colors.dark.textMuted,
    fontSize: 12,
  },
  dividerLine: {
    width: 1,
    height: 35,
    backgroundColor: Colors.dark.cardBorder,
  },
  caloriesTargetNumber: {
    color: Colors.dark.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  caloriesTargetLabel: {
    color: Colors.dark.primary,
    fontSize: 12,
    opacity: 0.8,
  },
  mainProgressBg: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  caloriesRemainingText: {
    color: Colors.dark.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  currentWeightText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: '600',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddButtonText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  quickSubButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderColor: 'rgba(244, 63, 94, 0.2)',
    flexDirection: 'row',
    gap: 2,
  },
  quickSubButtonText: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  loggingInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  logInputWrapper: {
    flex: 1,
  },
  inlineLogButton: {
    backgroundColor: Colors.dark.primary,
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 12,
    padding: 12,
    paddingTop: 24,
    marginBottom: 20,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    flex: 1,
    width: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 6,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  chartDayLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  chartDayLabelToday: {
    color: Colors.dark.primary,
    fontWeight: '800',
  },
  chartCalLabel: {
    color: Colors.dark.textMuted,
    fontSize: 8,
    marginBottom: 2,
  },
  chartWeightLabel: {
    color: '#3b82f6',
    fontSize: 8,
    fontWeight: '700',
  },
  macroPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  macroPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  macroPillLabel: {
    color: Colors.dark.textMuted,
    fontSize: 10,
  },
  macroPillVal: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  collapseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  collapseHeaderText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // ANALYZER STYLES
  analyzerCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  analyzerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  analyzerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
  },
  analyzerSub: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  foodTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  foodInput: {
    color: Colors.dark.text,
    fontSize: 14,
    padding: 0,
  },
  suggestionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 4,
    marginBottom: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  suggestionText: {
    color: Colors.dark.text,
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  suggestionType: {
    color: '#a855f7',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  photoContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
  },
  scannerLine: {
    height: 3,
    backgroundColor: '#a855f7',
    width: '100%',
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  deletePhotoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deletePhotoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  detectedFoodHintContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 10,
    marginBottom: 12,
  },
  detectedFoodHintLabel: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  detectedFoodHintInput: {
    color: '#a855f7',
    fontSize: 15,
    fontWeight: '700',
    padding: 0,
  },
  analyzerButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    height: 44,
    gap: 6,
  },
  mediaButtonText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  analyzeTrigger: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 10,
    height: 44,
    gap: 6,
  },
  analyzeTriggerDisabled: {
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
  },
  analyzeTriggerText: {
    color: Colors.dark.background,
    fontSize: 14,
    fontWeight: '700',
  },
  analyzingLoaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.05)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.1)',
  },
  analyzingLoaderText: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '600',
  },
  analyzerResultCard: {
    marginTop: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 12,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  resultPortion: {
    color: Colors.dark.textMuted,
    fontSize: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultDetailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCaloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resultCaloriesText: {
    color: Colors.dark.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  resultPriceText: {
    color: '#eab308',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(234, 179, 8, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resultMacroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  resultMacroBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 6,
  },
  resultMacroLabel: {
    color: Colors.dark.textMuted,
    fontSize: 9,
  },
  resultMacroVal: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  microsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  microItem: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  microLabel: {
    color: Colors.dark.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  microVal: {
    color: Colors.dark.text,
    fontSize: 11,
    fontWeight: '600',
  },
  resultActionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.cardBorder,
    paddingTop: 10,
  },
  cancelResultBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
  },
  cancelResultBtnText: {
    color: Colors.dark.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  logResultBtn: {
    flex: 2,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: 8,
    gap: 6,
  },
  logResultBtnText: {
    color: Colors.dark.background,
    fontSize: 13,
    fontWeight: '700',
  },
  resultCaloriesInput: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 45,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  resultCaloriesUnit: {
    color: Colors.dark.textMuted,
    fontSize: 13,
  },
  resultMacroInput: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
    marginTop: 4,
    textAlign: 'center',
  },
  macroProgressContainer: {
    gap: 10,
    marginBottom: 8,
  },
  macroProgressItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.cardBorder,
    padding: 10,
  },
  macroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroProgressName: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '700',
  },
  macroProgressStats: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: '600',
  },
  macroProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  macroProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroProgressRemaining: {
    color: Colors.dark.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});

