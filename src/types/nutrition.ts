export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  name: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
}

export interface WaterLog {
  date: string;
  glasses: number;
  target: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalType: string;
}

export interface DailyLog {
  date: string;
  meals: MealEntry[];
  water: WaterLog;
  weight?: number;
}

export interface FoodResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  price?: string;
}
