/**
 * Utility to translate exercise metadata from English (raw dataset values) to Spanish.
 */

export const translateMuscle = (muscle: string): string => {
  if (!muscle) return '';
  
  const translations: Record<string, string> = {
    // Body parts / Categories
    'back': 'Espalda',
    'cardio': 'Cardio',
    'chest': 'Pecho',
    'lower arms': 'Antebrazos',
    'lower legs': 'Pantorrillas',
    'neck': 'Cuello',
    'shoulders': 'Hombros',
    'upper arms': 'Brazos',
    'upper legs': 'Piernas',
    'waist': 'Abdomen / Cintura',

    // Specific target muscles
    'abs': 'Abdominales',
    'abductors': 'Abductores',
    'adductors': 'Aductores',
    'biceps': 'Bíceps',
    'calves': 'Gemelos / Pantorrillas',
    'cardiovascular system': 'Sistema Cardiovascular',
    'delts': 'Deltoides',
    'forearms': 'Antebrazos',
    'glutes': 'Glúteos',
    'hamstrings': 'Isquiotibiales',
    'lats': 'Dorsales',
    'levator scapulae': 'Elevador de la escápula',
    'pectorals': 'Pectorales',
    'quads': 'Cuádriceps',
    'serratus anterior': 'Serrato Anterior',
    'spine': 'Espalda Baja / Espinal',
    'traps': 'Trapecios',
    'triceps': 'Tríceps',
    'upper back': 'Espalda Alta',
  };

  const lower = muscle.toLowerCase().trim();
  return translations[lower] || muscle;
};

export const translateEquipment = (equipment: string): string => {
  if (!equipment) return '';

  const translations: Record<string, string> = {
    'assisted': 'Asistido',
    'band': 'Banda elástica',
    'barbell': 'Barra',
    'body weight': 'Peso corporal',
    'bosu ball': 'Bosu',
    'cable': 'Polea',
    'dumbbell': 'Mancuerna',
    'elliptical trainer': 'Elíptica',
    'ez barbell': 'Barra EZ',
    'hammer': 'Martillo',
    'kettlebell': 'Pesa rusa / Kettlebell',
    'leverage machine': 'Máquina de palanca',
    'medicine ball': 'Balón medicinal',
    'olympic barbell': 'Barra olímpica',
    'resistance band': 'Banda de resistencia',
    'roller': 'Rodillo',
    'rope': 'Cuerda',
    'skierg': 'Máquina de esquí',
    'slide board': 'Tabla de deslizamiento',
    'smith machine': 'Máquina Smith',
    'stability ball': 'Pelota de estabilidad',
    'stationary bike': 'Bicicleta estática',
    'stepmill climbmill': 'Escaladora',
    'tire': 'Neumático',
    'trap bar': 'Barra hexagonal',
    'weighted': 'Con peso / Lastrado',
    'wheel roller': 'Rueda abdominal',
  };

  const lower = equipment.toLowerCase().trim();
  return translations[lower] || equipment;
};

export const translateExerciseName = (name: string): string => {
  if (!name) return '';
  
  let translated = name.toLowerCase().trim();
  
  // 1. Exact matches or highly specific phrases first
  const exactTranslations: Record<string, string> = {
    '3/4 sit-up': 'Abdominales 3/4',
    '45° side bend': 'Inclinación lateral a 45°',
    'air bike': 'Bicicleta abdominal',
    'alternate heel touchers': 'Toque de talones alterno',
    'all fours squad stretch': 'Estiramiento en cuadrupedia',
  };
  
  if (exactTranslations[translated]) {
    return exactTranslations[translated];
  }
  
  // List of suffixes to append at the end
  const suffixes: string[] = [];
  
  // 2. Extract modifiers and queue them as suffixes
  const modifiers: [RegExp, string][] = [
    [/\bdumbbell\b/g, 'con mancuerna'],
    [/\bbarbell\b/g, 'con barra'],
    [/\bcable\b/g, 'con polea'],
    [/\bmachine\b/g, 'en máquina'],
    [/\bkettlebell\b/g, 'con pesa rusa'],
    [/\bmedicine ball\b/g, 'con balón medicinal'],
    [/\bstability ball\b/g, 'con pelota de estabilidad'],
    [/\belastic band\b/g, 'con banda elástica'],
    [/\band\b/g, 'y'],
    [/\bassisted\b/g, 'asistido'],
    [/\bweighted\b/g, 'con peso'],
    [/\blying\b/g, 'tumbado'],
    [/\bseated\b/g, 'sentado'],
    [/\bstanding\b/g, 'de pie'],
    [/\bkneeling\b/g, 'arrodillado'],
    [/\bhanging\b/g, 'colgado'],
    [/\bincline\b/g, 'inclinado'],
    [/\bdecline\b/g, 'declinado'],
  ];
  
  for (const [regex, suffix] of modifiers) {
    if (regex.test(translated)) {
      translated = translated.replace(regex, '').replace(/\s+/g, ' ').trim();
      suffixes.push(suffix);
    }
  }
  
  // 3. Phrase replacements for compound exercise names
  const phrases: [RegExp, string][] = [
    [/\bbench press\b/g, 'press de banca'],
    [/\bbicep curl\b/g, 'curl de bíceps'],
    [/\btricep extension\b/g, 'extensión de tríceps'],
    [/\bcalf raise\b/g, 'elevación de pantorrillas'],
    [/\bleg extension\b/g, 'extensión de piernas'],
    [/\bleg curl\b/g, 'curl de piernas'],
    [/\bchest fly\b/g, 'aperturas de pecho'],
    [/\bshoulder press\b/g, 'press de hombros'],
    [/\blateral raise\b/g, 'elevación lateral'],
    [/\bfront raise\b/g, 'elevación frontal'],
    [/\bwrist curl\b/g, 'curl de muñeca'],
    [/\bleg raise\b/g, 'elevación de piernas'],
    [/\bknee raise\b/g, 'elevación de rodillas'],
    [/\btoe touch\b/g, 'toque de puntas'],
    [/\bheel touch\b/g, 'toque de talón'],
    [/\bsit-up\b/g, 'abdominales'],
    [/\bpull-up\b/g, 'dominada'],
    [/\bpush-up\b/g, 'flexión'],
    [/\bchin-up\b/g, 'dominada supina'],
    [/\bdeadlift\b/g, 'peso muerto'],
    [/\bside bend\b/g, 'inclinación lateral'],
    [/\bunderhand\b/g, 'agarre supino'],
    [/\boverhand\b/g, 'agarre prono'],
    [/\bclose grip\b/g, 'agarre cerrado'],
    [/\bwide grip\b/g, 'agarre ancho'],
    [/\breverse grip\b/g, 'agarre invertido'],
    [/\bone arm\b/g, 'a un brazo'],
    [/\bsingle arm\b/g, 'a un brazo'],
    [/\bsingle leg\b/g, 'a una pierna'],
  ];
  
  for (const [regex, replacement] of phrases) {
    translated = translated.replace(regex, replacement);
  }
  
  // 4. Word-by-word replacements for remaining root nouns/verbs
  const words: Record<string, string> = {
    'squat': 'sentadilla',
    'squats': 'sentadillas',
    'lunge': 'zancada',
    'lunges': 'zancadas',
    'stretch': 'estiramiento',
    'circles': 'círculos',
    'rotation': 'rotación',
    'twist': 'giro',
    'crunch': 'crunch',
    'crunches': 'crunches',
    'plank': 'plancha',
    'dip': 'fondo',
    'dips': 'fondos',
    'row': 'remo',
    'rows': 'remos',
    'fly': 'apertura',
    'flys': 'aperturas',
    'press': 'press',
    'curl': 'curl',
    'raise': 'elevación',
    'raises': 'elevaciones',
    'shrug': 'encogimiento',
    'shrugs': 'encogimientos',
    'extension': 'extensión',
    'kickback': 'patada de tríceps',
    'kickbacks': 'patadas de tríceps',
    'pull': 'jalón',
    'push': 'empuje',
    'clean': 'cargada',
    'snatch': 'arrancada',
    'side': 'lateral',
  };
  
  const tokens = translated.split(' ');
  const processedTokens = tokens.map(token => words[token] || token);
  translated = processedTokens.join(' ').replace(/\s+/g, ' ').trim();
  
  // 5. Append suffixes
  if (suffixes.length > 0) {
    translated = `${translated} ${suffixes.join(' ')}`;
  }
  
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

