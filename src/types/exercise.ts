export type BodyPart =
  | 'back'
  | 'cardio'
  | 'chest'
  | 'lower arms'
  | 'lower legs'
  | 'neck'
  | 'shoulders'
  | 'upper arms'
  | 'upper legs'
  | 'waist';

export interface LanguageMap {
  en: string;
  es: string;
  it: string;
  tr: string;
  ru: string;
  zh: string;
  [key: string]: string;
}

export interface LanguageStepsMap {
  en: string[];
  es: string[];
  it: string[];
  tr: string[];
  ru: string[];
  zh: string[];
  [key: string]: string[];
}

export interface Exercise {
  id: string; // unique numeric identifier, zero-padded to 4 digits (e.g. "0001")
  name: string; // Full exercise name
  category: string; // Body part category. Mirrors body_part
  body_part: BodyPart; // Body part targeted
  equipment: string; // Required equipment
  instructions: LanguageMap; // Step-by-step instructions as single string per language
  instruction_steps: LanguageStepsMap; // Instructions split into an ordered array of steps
  muscle_group: string; // Primary synergist muscle group
  secondary_muscles: string[]; // Additional muscles involved
  target: string; // Primary target muscle
  media_id: string; // Original media reference id
  image: string; // Path to the 180x180 thumbnail (e.g. "images/0001-2gPfomN.jpg")
  gif_url: string; // Path to the 180x180 animation GIF (e.g. "videos/0001-2gPfomN.gif")
  attribution: string; // Media copyright notice
  created_at: string; // ISO 8601 timestamp
}

export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
}

export interface WorkoutState {
  currentExerciseIndex: number;
  isResting: boolean;
  timeRemaining: number; // in seconds
  completedExercises: string[];
}
