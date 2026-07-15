import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../../src/constants/Colors';
import { useTheme } from '../../src/contexts/ThemeContext';
import { storage } from '../../src/services/storage';
import * as ImagePicker from 'expo-image-picker';
import { searchLocalDB, searchOpenFoodFacts, searchByBarcode, ProductSchema } from '../../src/services/foodApi';
import { MealEntry, WeightEntry } from '../../src/types/nutrition';
import { analyzeFoodWithAI, getGeminiApiKey, saveGeminiApiKey } from '../../src/services/gemini';
import BarcodeScanner from '../../src/components/BarcodeScanner';
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
  Trash2,
  Droplets,
  Settings,
  Lightbulb,
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

// Product search uses mexican_foods.json + food_database.json (Peru) + Open Food Facts API

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
  
  // Whether to show the results section
  const [showResults, setShowResults] = useState(false);

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

  const [workoutCalories, setWorkoutCalories] = useState(0);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

  const loadTodayMeals = async () => {
    const meals = await storage.getMealsByDate(todayStr);
    setTodayMeals(meals);
  };

  const loadWaterLog = async () => {
    const log = await storage.getWaterLog(todayStr);
    setWaterGlasses(log?.glasses ?? 0);
  };

  const loadWeightHistory = async () => {
    const history = await storage.getWeightHistory();
    setWeightHistory(history.sort((a, b) => a.date.localeCompare(b.date)));
  };

  // Load saved goal and logs on mount
  const loadData = async () => {
    const goalData = await storage.getCalorieGoal();
    const logsData = await storage.getDailyLogs();
    
    setSavedGoal(goalData);
    setDailyLogs(logsData);
    await loadTodayMeals();
    await loadWaterLog();
    await loadWeightHistory();
    
    const wc = await storage.getTodayWorkoutCalories();
    setWorkoutCalories(wc);

    const key = await getGeminiApiKey();
    setHasGeminiKey(!!key);

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

  // Autocomplete database search suggestions (mexican + peruvian)
  const suggestions = useMemo(() => {
    const query = foodTextInput.trim().toLowerCase();
    if (!query || query.length < 2) return [];

    const allNames = [
      'Tortilla de maíz', 'Tortilla de harina', 'Frijoles refritos', 'Frijoles negros',
      'Arroz blanco', 'Arroz rojo', 'Aguacate', 'Guacamole',
      'Pechuga de pollo', 'Milanesa de pollo', 'Bistec de res', 'Carnitas',
      'Barbacoa', 'Pastor', 'Chorizo', 'Longaniza',
      'Queso Oaxaca', 'Queso Panela', 'Crema', 'Nopal',
      'Chile jalapeño', 'Chile serrano', 'Chile poblano',
      'Huevo', 'Leche', 'Yogurt', 'Panela',
      'Pescado', 'Atún', 'Salmón', 'Tilapia',
    ];

    const matches: ProductSchema[] = [];
    for (const item of allNames) {
      if (item.toLowerCase().includes(query)) {
        const dbMatch = searchLocalDB(item);
        if (dbMatch) {
          matches.push(dbMatch);
          if (matches.length >= 5) break;
        }
      }
    }
    return matches;
  }, [foodTextInput]);

  // Show Results & Scroll
  const handleCalculate = () => {
    if (!previewMacros) {
      Alert.alert('Error', 'Por favor completa todos los campos con valores válidos.');
      return;
    }
    setShowResults(true);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Set calculated values as Active Daily Goal
  const handleSetAsGoal = async () => {
    if (!previewMacros) return;

    const newGoal = {
      calories: previewMacros.targetCalories,
      protein: previewMacros.protein,
      carbs: previewMacros.carbs,
      fat: previewMacros.fat,
      goalType: goal,
    };

    const success = await storage.saveCalorieGoal(newGoal);
    if (success) {
      setSavedGoal(newGoal);
      setShowResults(false);
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
    }
    // Botones rápidos solo afectan calorías; macros solo con el analizador
    
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
    if (isNaN(val) || val <= 0 || val > 500) {
      Alert.alert('Error', 'Por favor ingresa un peso válido (1kg - 500kg).');
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
      await storage.saveWeightEntry({ date: todayStr, weight: val });
      await loadWeightHistory();
      const updatedLogs = await storage.getDailyLogs();
      setDailyLogs(updatedLogs);
      setWeightInputValue('');
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
          setShowResults(false);
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
      setFoodTextInput('');
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
      setFoodTextInput('');
    }
  };

  // Database-backed search (local DB → Open Food Facts API → defaults editables)
  const analyzeFood = async () => {
    if (!foodTextInput.trim() && !selectedImageUri) {
      Alert.alert('Error', 'Por favor ingresa una descripción o selecciona una foto de tu comida.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzerResults(null);
    setAnalyzingStep('Buscando en base de datos local...');

    const query = foodTextInput.trim();

    // Tier 1: Search local DB (mexican + peruvian)
    const localMatch = searchLocalDB(query);

    if (localMatch) {
      setIsAnalyzing(false);
      setAnalyzerResults({
        name: localMatch.name,
        calories: Math.round(localMatch.nutrition.calories),
        protein: localMatch.nutrition.protein,
        carbs: localMatch.nutrition.carbs,
        fat: localMatch.nutrition.fat,
        calcio: '',
        hierro: '',
        sodio: '',
        potasio: '',
        vitaminaC: '',
        vitaminaA: '',
        portion: '100g de porción',
        priceInfo: undefined,
      });
      return;
    }

    // Tier 2: Try Open Food Facts API
    setAnalyzingStep('Consultando Open Food Facts...');
    const apiResult = await searchOpenFoodFacts(query);

    if (apiResult) {
      setIsAnalyzing(false);
      setAnalyzerResults({
        name: apiResult.name,
        calories: apiResult.calories,
        protein: apiResult.protein,
        carbs: apiResult.carbs,
        fat: apiResult.fat,
        calcio: '',
        hierro: '',
        sodio: '',
        potasio: '',
        vitaminaC: '',
        vitaminaA: '',
        portion: '100g de porción',
        priceInfo: undefined,
      });
      return;
    }

    // Tier 3: Defaults editables
    setIsAnalyzing(false);
    setAnalyzerResults({
      name: query.charAt(0).toUpperCase() + query.slice(1).toLowerCase(),
      calories: 200,
      protein: 15,
      carbs: 20,
      fat: 8,
      calcio: '',
      hierro: '',
      sodio: '',
      potasio: '',
      vitaminaC: '',
      vitaminaA: '',
      portion: 'Valores estimados - edita según tu porción real',
    });
  };

  const handleBarcodeScanned = async (barcode: string) => {
    setShowBarcodeScanner(false);
    setIsAnalyzing(true);
    setAnalyzingStep('Buscando producto por código de barras...');

    const result = await searchByBarcode(barcode);
    if (result) {
      setIsAnalyzing(false);
      setAnalyzerResults({
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        calcio: '',
        hierro: '',
        sodio: '',
        potasio: '',
        vitaminaC: '',
        vitaminaA: '',
        portion: '100g de porción',
        priceInfo: undefined,
      });
    } else {
      setIsAnalyzing(false);
      setFoodTextInput(`Código: ${barcode}`);
      Alert.alert('No encontrado', 'No se encontró el producto. Ingresa los datos manualmente.');
    }
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

    const meal: MealEntry = {
      id: Date.now().toString(),
      name: analyzerResults.name,
      mealType: selectedMealType,
      calories: analyzerResults.calories,
      protein: analyzerResults.protein,
      carbs: analyzerResults.carbs,
      fat: analyzerResults.fat,
      timestamp: new Date().toISOString(),
    };
    await storage.saveMealEntry(todayStr, meal);
    await loadTodayMeals();

    Alert.alert(
      'Añadido', 
      `Se han sumado +${analyzerResults.calories} kcal de "${analyzerResults.name}" a tu consumo diario.`
    );
    
    handleClearAnalyzer();
  };

  const handleClearAnalyzer = () => {
    setFoodTextInput('');
    setSelectedImageUri(null);
    setAnalyzerResults(null);
  };

  const handleAnalyzeWithAI = async () => {
    if (!foodTextInput.trim() && !selectedImageUri) {
      Alert.alert('Error', 'Describe la comida o toma una foto primero.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingStep('Analizando con Gemini AI...');

    let base64Image: string | null = null;
    if (selectedImageUri) {
      const response = await fetch(selectedImageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      base64Image = await new Promise((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });
    }

    const result = await analyzeFoodWithAI(base64Image, foodTextInput);

    if (result) {
      setAnalyzerResults({
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        calcio: '',
        hierro: '',
        sodio: '',
        potasio: '',
        vitaminaC: '',
        vitaminaA: '',
        portion: 'Porción estimada por IA',
      });
    } else {
      Alert.alert('Error', 'No se pudo analizar con IA. Verifica tu API key o intenta de nuevo.');
    }

    setIsAnalyzing(false);
  };

  const handleConfigureGemini = () => {
    Alert.prompt
      ? Alert.prompt('Gemini API Key', 'Ingresa tu API key de Google Gemini:', [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Guardar',
            onPress: async (text?: string) => {
              if (text && text.trim()) {
                await saveGeminiApiKey(text.trim());
                setHasGeminiKey(true);
                Alert.alert('Éxito', 'API key guardada correctamente.');
              }
            },
          },
        ], 'plain-text')
      : (() => {
          Alert.alert(
            'Gemini API Key',
            'Ingresa tu API key de Google Gemini en el campo de texto.',
            [{ text: 'OK' }]
          );
        })();
  };

  // Calculate current today progress details
  const todayCalories = dailyLogs[todayStr]?.caloriesConsumed || 0;
  const todayWeight = dailyLogs[todayStr]?.weight;
  const todayProtein = Math.max(0, dailyLogs[todayStr]?.proteinConsumed || 0);
  const todayCarbs = Math.max(0, dailyLogs[todayStr]?.carbsConsumed || 0);
  const todayFat = Math.max(0, dailyLogs[todayStr]?.fatConsumed || 0);
  
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                  <Flame size={20} color={colors.primary} />
                  <Text style={styles.dashboardTitle}>Tu Progreso Diario</Text>
                </View>
                <Pressable onPress={handleResetGoal} style={styles.recalcLink}>
                  <RefreshCw size={14} color={colors.textMuted} />
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
                        backgroundColor: todayCalories > savedGoal.calories ? colors.accent : colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.progressDetailsRow}>
                  <Text style={styles.caloriesRemainingText}>
                    {todayCalories >= savedGoal.calories
                      ? `Excedido por ${todayCalories - savedGoal.calories} kcal`
                      : todayCalories < 0
                      ? `Saldo negativo: ${todayCalories} kcal`
                      : `Faltan ${savedGoal.calories - todayCalories} kcal para tu meta`}
                  </Text>
                  {latestWeight && (
                    <Text style={styles.currentWeightText}>
                      Peso: {latestWeight} kg
                    </Text>
                  )}
                </View>

                {/* Workout Calories */}
                {workoutCalories > 0 && (
                  <View style={styles.workoutCalRow}>
                    <Flame size={14} color="#f97316" />
                    <Text style={styles.workoutCalText}>-{workoutCalories} kcal de ejercicio</Text>
                  </View>
                )}
                {savedGoal && workoutCalories > 0 && (
                  <Text style={styles.netCalText}>
                    Neto: {Math.max(0, todayCalories - workoutCalories)} / {savedGoal.calories}
                  </Text>
                )}
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
                <Pressable onPress={() => handleModifyCalories(-100)} style={[styles.quickAddButton, styles.quickSubButton]}>
                  <Minus size={14} color={colors.accent} />
                  <Text style={styles.quickSubButtonText}>100</Text>
                </Pressable>
              </View>

              {/* Custom Calorie & Weight Row */}
              <View style={styles.loggingInputsRow}>
                <View style={styles.logInputWrapper}>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder="Añadir kcal..."
                      placeholderTextColor={colors.textMuted}
                      value={calorieInputValue}
                      onChangeText={setCalorieInputValue}
                    />
                    <Pressable onPress={handleCustomCalorieSubmit} style={styles.inlineLogButton}>
                      <Plus size={16} color={colors.background} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.logInputWrapper}>
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      placeholder={latestWeight ? `${latestWeight} kg` : "Ej. 72.5"}
                      placeholderTextColor={colors.textMuted}
                      value={weightInputValue}
                      onChangeText={setWeightInputValue}
                    />
                    <Pressable onPress={handleWeightSubmit} style={[styles.inlineLogButton, { backgroundColor: '#3b82f6' }]}>
                      <Scale size={16} color={colors.text} />
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
                  let barColor = colors.primary;
                  if (log.caloriesConsumed === 0) {
                    barColor = colors.cardBorder;
                  } else if (log.caloriesConsumed > savedGoal.calories * 1.1) {
                    barColor = colors.accent;
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
                          width: `${Math.min(100, Math.max(0, (todayProtein / savedGoal.protein) * 100))}%`,
                          backgroundColor: '#3b82f6',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayProtein >= savedGoal.protein
                      ? '¡Meta cumplida!'
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
                          width: `${Math.min(100, Math.max(0, (todayCarbs / savedGoal.carbs) * 100))}%`,
                          backgroundColor: '#ef4444',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayCarbs >= savedGoal.carbs
                      ? '¡Meta cumplida!'
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
                          width: `${Math.min(100, Math.max(0, (todayFat / savedGoal.fat) * 100))}%`,
                          backgroundColor: '#eab308',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroProgressRemaining}>
                    {todayFat >= savedGoal.fat
                      ? '¡Meta cumplida!'
                      : `${Math.round(savedGoal.fat - todayFat)}g restantes`}
                  </Text>
                </View>

              </View>

              {/* Goal-based recommendation */}
              {savedGoal.goalType && (
                <View style={[styles.goalRecommendationCard, 
                  savedGoal.goalType === 'perder' && { borderColor: '#ef4444' },
                  savedGoal.goalType === 'mantener' && { borderColor: '#3b82f6' },
                  savedGoal.goalType === 'ganar' && { borderColor: '#22c55e' },
                ]}>
                  <Lightbulb size={18} color="#a855f7" />
                  <Text style={styles.goalRecommendationText}>
                    {savedGoal.goalType === 'perder' && 'Estás en déficit calórico. Prioriza proteínas para preservar músculo. Intenta consumir más verduras y fibra.'}
                    {savedGoal.goalType === 'mantener' && 'Estás en mantenimiento. Mantén un equilibrio de macros y varía tus fuentes de alimentos.'}
                    {savedGoal.goalType === 'ganar' && 'Estás en superávit calórico. Aumenta el consumo de carbohidratos complejos y proteínas de calidad.'}
                  </Text>
                </View>
              )}

              {/* Water Tracker */}
              <View style={styles.waterSection}>
                <View style={styles.waterHeader}>
                  <Droplets size={18} color="#3b82f6" />
                  <Text style={styles.waterTitle}>Agua</Text>
                  <Text style={styles.waterCount}>{waterGlasses} / 8 vasos</Text>
                </View>
                <View style={styles.waterControls}>
                  <Pressable
                    onPress={async () => {
                      if (waterGlasses > 0) {
                        const next = waterGlasses - 1;
                        setWaterGlasses(next);
                        await storage.saveWaterLog({ date: todayStr, glasses: next, target: 8 });
                      }
                    }}
                    style={[styles.waterBtn, waterGlasses === 0 && { opacity: 0.4 }]}
                    disabled={waterGlasses === 0}
                  >
                    <Minus size={18} color={colors.text} />
                  </Pressable>
                  <View style={styles.waterBarBg}>
                    <View style={[styles.waterBarFill, { width: `${Math.min(100, (waterGlasses / 8) * 100)}%` }]} />
                  </View>
                  <Pressable
                    onPress={async () => {
                      if (waterGlasses < 20) {
                        const next = waterGlasses + 1;
                        setWaterGlasses(next);
                        await storage.saveWaterLog({ date: todayStr, glasses: next, target: 8 });
                      }
                    }}
                    style={styles.waterBtn}
                  >
                    <Plus size={18} color={colors.text} />
                  </Pressable>
                </View>
              </View>

              {/* Weight History Chart */}
              {weightHistory.length >= 2 && (
                <View style={styles.weightChartSection}>
                  <View style={styles.waterHeader}>
                    <Scale size={18} color="#3b82f6" />
                    <Text style={styles.waterTitle}>Evolución de Peso</Text>
                  </View>
                  <View style={styles.weightChartContainer}>
                    {(() => {
                      const recent = weightHistory.slice(-14);
                      const maxW = Math.max(...recent.map((w) => w.weight));
                      const minW = Math.min(...recent.map((w) => w.weight));
                      const range = maxW - minW || 1;
                      return (
                        <View style={styles.weightBarsRow}>
                          {recent.map((entry, i) => {
                            const barH = ((entry.weight - minW) / range) * 80 + 20;
                            return (
                              <View key={i} style={styles.weightBarCol}>
                                <View style={[styles.weightBar, { height: barH }]} />
                                <Text style={styles.weightBarLabel}>{entry.weight}</Text>
                                <Text style={styles.weightBarDate}>
                                  {new Date(entry.date + 'T12:00:00').getDate()}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      );
                    })()}
                  </View>
                </View>
              )}

              {/* Today's Meals Section */}
              {todayMeals.length > 0 && (
                <View style={styles.todayMealsSection}>
                  <Text style={styles.label}>Comidas de Hoy</Text>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                    const labels = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' };
                    const meals = todayMeals.filter((m) => m.mealType === type);
                    if (meals.length === 0) return null;
                    return (
                      <View key={type} style={styles.mealGroup}>
                        <Text style={styles.mealGroupTitle}>{labels[type]}</Text>
                        {meals.map((meal) => (
                          <View key={meal.id} style={styles.mealEntry}>
                            <View style={styles.mealEntryInfo}>
                              <Text style={styles.mealEntryName} numberOfLines={1}>{meal.name}</Text>
                              <Text style={styles.mealEntryMacros}>
                                {meal.calories} kcal · P:{meal.protein}g · C:{meal.carbs}g · G:{meal.fat}g
                              </Text>
                            </View>
                            <Pressable
                              onPress={async () => {
                                await storage.deleteMealEntry(todayStr, meal.id);
                                await handleModifyCalories(-meal.calories, -meal.protein, -meal.carbs, -meal.fat);
                                await loadTodayMeals();
                              }}
                              style={styles.mealDeleteBtn}
                            >
                              <Trash2 size={14} color={colors.accent} />
                            </Pressable>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* SMART FOOD ANALYZER CARD */}
          <View style={styles.analyzerCard}>
            <View style={styles.analyzerHeader}>
              <Sparkles size={20} color="#a855f7" />
              <Text style={styles.analyzerTitle}>Buscador de Alimentos</Text>
            </View>
            <Text style={styles.analyzerSub}>
              Busca productos en la base de datos local (comida mexicana) o en Open Food Facts (+3M productos).
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
                  placeholderTextColor={colors.textMuted}
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
                    <Text style={styles.suggestionType}>{'alimento'}</Text>
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
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            )}

            {/* Action Triggers */}
            <View style={styles.analyzerButtonsRow}>
              {!selectedImageUri && (
                <>
                  <Pressable onPress={takePhoto} style={styles.mediaButton}>
                    <Camera size={18} color={colors.primary} />
                    <Text style={styles.mediaButtonText}>Cámara</Text>
                  </Pressable>
                  <Pressable onPress={pickImage} style={styles.mediaButton}>
                    <ImageIcon size={18} color={colors.primary} />
                    <Text style={styles.mediaButtonText}>Galería</Text>
                  </Pressable>
                  <Pressable onPress={() => setShowBarcodeScanner(true)} style={styles.mediaButton}>
                    <Scan size={18} color={colors.primary} />
                    <Text style={styles.mediaButtonText}>Escanear</Text>
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
                <Scan size={18} color={colors.background} />
                <Text style={styles.analyzeTriggerText}>
                  {isAnalyzing ? 'Analizando...' : 'Analizar'}
                </Text>
              </Pressable>
            </View>

            {/* AI Analysis Button */}
            <View style={styles.aiRow}>
              {hasGeminiKey ? (
                <Pressable
                  onPress={handleAnalyzeWithAI}
                  style={[
                    styles.aiButton,
                    (isAnalyzing || (!foodTextInput.trim() && !selectedImageUri)) && styles.aiButtonDisabled,
                  ]}
                  disabled={isAnalyzing}
                >
                  <Sparkles size={16} color={colors.background} />
                  <Text style={styles.aiButtonText}>Analizar con IA (Gemini)</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleConfigureGemini}
                  style={styles.aiButton}
                >
                  <Settings size={16} color="#a855f7" />
                  <Text style={[styles.aiButtonText, { color: '#a855f7' }]}>Configurar Gemini</Text>
                </Pressable>
              )}
              {hasGeminiKey && (
                <Pressable onPress={handleConfigureGemini} style={styles.aiSettingsBtn}>
                  <Settings size={18} color={colors.textMuted} />
                </Pressable>
              )}
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
                    <Flame size={18} color={colors.primary} />
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

                {/* Meal Type Selector */}
                <Text style={styles.label}>Añadir a</Text>
                <View style={styles.mealTypeRow}>
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => {
                    const labels = { breakfast: 'Desayuno', lunch: 'Comida', dinner: 'Cena', snack: 'Snack' };
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setSelectedMealType(type)}
                        style={[styles.mealTypeBtn, selectedMealType === type && styles.mealTypeBtnActive]}
                      >
                        <Text style={[styles.mealTypeBtnText, selectedMealType === type && styles.mealTypeBtnTextActive]}>
                          {labels[type]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Log button */}
                <View style={styles.resultActionRow}>
                  <Pressable onPress={handleClearAnalyzer} style={styles.cancelResultBtn}>
                    <Text style={styles.cancelResultBtnText}>Cerrar</Text>
                  </Pressable>
                  <Pressable onPress={handleAddAnalyzedCalories} style={styles.logResultBtn}>
                    <Plus size={16} color={colors.background} />
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
                <Calculator size={18} color={colors.primary} />
                <Text style={styles.collapseHeaderText}>Recalcular Meta Nutricional</Text>
              </View>
              {isCalculatorExpanded ? (
                <ChevronUp size={18} color={colors.textMuted} />
              ) : (
                <ChevronDown size={18} color={colors.textMuted} />
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
                  <User size={18} color={gender === 'masculino' ? colors.background : colors.textMuted} />
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
                  <User size={18} color={gender === 'femenino' ? colors.background : colors.textMuted} />
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
                      placeholderTextColor={colors.textMuted}
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
                      placeholderTextColor={colors.textMuted}
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
                      placeholderTextColor={colors.textMuted}
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
                  <Calculator size={18} color={colors.background} />
                  <Text style={styles.calculateButtonText}>Calcular Calorías</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* CALCULATION PREVIEW & SET GOAL DASHBOARD */}
          {showResults && previewMacros && (
            <View style={styles.resultsCard}>
              <View style={styles.resultsHeader}>
                <Flame size={24} color={colors.primary} />
                <Text style={styles.resultsTitle}>Resultado Calculado</Text>
              </View>

              {/* Calories Target */}
              <View style={styles.caloriesBanner}>
                <Text style={styles.caloriesNumber}>
                  {previewMacros.targetCalories.toLocaleString()}
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
                  <Text style={styles.statValue}>{previewMacros.bmr} kcal</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Gasto Diario (TDEE)</Text>
                  <Text style={styles.statValue}>{previewMacros.tdee} kcal</Text>
                </View>
              </View>

              {/* Macros Breakdown */}
              <View style={styles.macrosContainer}>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Proteínas:</Text>
                  <Text style={styles.macroStatVal}>{previewMacros.protein}g</Text>
                </View>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Carbohidratos:</Text>
                  <Text style={styles.macroStatVal}>{previewMacros.carbs}g</Text>
                </View>
                <View style={styles.macroStatRow}>
                  <Text style={styles.macroStatName}>Grasas:</Text>
                  <Text style={styles.macroStatVal}>{previewMacros.fat}g</Text>
                </View>
              </View>

              {/* Set as Active Goal button */}
              <Pressable onPress={handleSetAsGoal} style={styles.saveGoalButton}>
                <Award size={18} color={colors.background} />
                <Text style={styles.saveGoalButtonText}>Establecer como Meta Activa</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <BarcodeScanner
        visible={showBarcodeScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowBarcodeScanner(false)}
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  label: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    height: 44,
    gap: 6,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: colors.background,
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
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  unitText: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    padding: 10,
    alignItems: 'center',
  },
  goalCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  goalTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  goalTextActive: {
    color: colors.primary,
  },
  goalDesc: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    padding: 12,
  },
  activityCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  activityLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  activityLabelActive: {
    color: colors.primary,
  },
  activityFactor: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activityDesc: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  splitTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    backgroundColor: colors.primary,
  },
  splitTabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  splitTabTextActive: {
    color: colors.background,
    fontWeight: '700',
  },
  actionButtons: {
    marginTop: 10,
  },
  calculateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  calculateButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  resultsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
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
    color: colors.primary,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  caloriesLabel: {
    color: colors.textMuted,
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
    color: colors.text,
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
    borderColor: colors.cardBorder,
    padding: 10,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  macrosContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  macroStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroStatName: {
    color: colors.textMuted,
    fontSize: 14,
  },
  macroStatVal: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  saveGoalButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  
  // DASHBOARD SPECIFIC STYLES
  dashboardCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
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
    borderColor: colors.cardBorder,
  },
  recalcLinkText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  caloriesConsumedLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  dividerLine: {
    width: 1,
    height: 35,
    backgroundColor: colors.cardBorder,
  },
  caloriesTargetNumber: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  caloriesTargetLabel: {
    color: colors.primary,
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
    color: colors.textMuted,
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
    color: colors.primary,
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
    color: colors.accent,
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
    backgroundColor: colors.primary,
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
    borderColor: colors.cardBorder,
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
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  chartDayLabelToday: {
    color: colors.primary,
    fontWeight: '800',
  },
  chartCalLabel: {
    color: colors.textMuted,
    fontSize: 8,
    marginBottom: 2,
  },
  chartWeightLabel: {
    color: '#3b82f6',
    fontSize: 8,
    fontWeight: '700',
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // ANALYZER STYLES
  analyzerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  analyzerSub: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  foodTextContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  foodInput: {
    color: colors.text,
    fontSize: 14,
    padding: 0,
  },
  suggestionsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
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
    color: colors.text,
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
    borderColor: colors.cardBorder,
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
    borderColor: colors.cardBorder,
    padding: 10,
    marginBottom: 12,
  },
  detectedFoodHintLabel: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    height: 44,
    gap: 6,
  },
  mediaButtonText: {
    color: colors.text,
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
    color: colors.background,
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
    borderColor: colors.cardBorder,
    padding: 12,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  resultPortion: {
    color: colors.textMuted,
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
    borderColor: colors.cardBorder,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 6,
  },
  resultMacroLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  resultMacroVal: {
    color: colors.text,
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
    borderColor: colors.cardBorder,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
  },
  microLabel: {
    color: colors.textMuted,
    fontSize: 9,
    marginBottom: 2,
  },
  microVal: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  resultActionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: 10,
  },
  cancelResultBtn: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cancelResultBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  logResultBtn: {
    flex: 2,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: 6,
  },
  logResultBtnText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '700',
  },
  resultCaloriesInput: {
    color: colors.primary,
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
    color: colors.textMuted,
    fontSize: 13,
  },
  resultMacroInput: {
    color: colors.text,
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
    borderColor: colors.cardBorder,
    padding: 10,
  },
  macroProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  macroProgressName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  macroProgressStats: {
    color: colors.text,
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
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  goalRecommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(168, 85, 247, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.2)',
    padding: 12,
    marginTop: 12,
  },
  goalRecommendationText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },

  // ─── Meal Type Selector ────────────────────────────────
  mealTypeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  mealTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    alignItems: 'center',
  },
  mealTypeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  mealTypeBtnText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  mealTypeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // ─── Today's Meals ────────────────────────────────────
  todayMealsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  mealGroup: {
    marginBottom: 12,
  },
  mealGroupTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  mealEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  mealEntryInfo: {
    flex: 1,
    marginRight: 8,
  },
  mealEntryName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  mealEntryMacros: {
    color: colors.textMuted,
    fontSize: 11,
  },
  mealDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Water Tracker ──────────────────────────────────────
  waterSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  waterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  waterTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  waterCount: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '700',
  },
  waterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  waterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: colors.cardBorder,
    borderRadius: 5,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },

  // ─── Weight History Chart ───────────────────────────────
  weightChartSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  weightChartContainer: {
    marginTop: 8,
  },
  weightBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  weightBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  weightBar: {
    width: '60%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    opacity: 0.7,
    minHeight: 4,
  },
  weightBarLabel: {
    color: colors.text,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  weightBarDate: {
    color: colors.textMuted,
    fontSize: 8,
  },

  // ─── Workout Calories ───────────────────────────────────
  workoutCalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  workoutCalText: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: '700',
  },
  netCalText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },

  // ─── AI Gemini Analysis ─────────────────────────────────
  aiRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  aiButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#a855f7',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#a855f7',
    height: 44,
    gap: 6,
  },
  aiButtonDisabled: {
    opacity: 0.4,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  aiSettingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
}

