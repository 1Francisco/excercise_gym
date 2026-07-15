import type { RoutineExercise } from '../types/exercise';

interface DefaultRoutineTemplate {
  name: string;
  description: string;
  exercises: RoutineExercise[];
}

// Map of exercise names to common IDs from the exercises dataset
// These are common exercises that should exist in most datasets
const EX = {
  benchPress: '0021',
  inclineBenchPress: '0028',
  dumbbellFly: '0035',
  pushUp: '0036',
  shoulderPress: '0125',
  lateralRaise: '0136',
  frontRaise: '0142',
  bentOverRow: '0191',
  latPulldown: '0181',
  seatedRow: '0197',
  deadlift: '0210',
  squat: '0311',
  legPress: '0325',
  legExtension: '0332',
  legCurl: '0341',
  calfRaise: '0351',
  tricepsPushdown: '0417',
  skullCrusher: '0421',
  bicepCurl: '0431',
  hammerCurl: '0440',
  plank: '0451',
  crunch: '0455',
  russianTwist: '0462',
  pullUp: '0175',
  dip: '0425',
  walkingLunge: '0305',
  romanianDeadlift: '0215',
  facePull: '0150',
  reverseFly: '0205',
};

export const DEFAULT_ROUTINES: DefaultRoutineTemplate[] = [
  {
    name: 'Push / Pull / Legs — Push A',
    description: 'Enfoque en pecho, hombros y tríceps',
    exercises: [
      { exerciseId: EX.benchPress, defaultSets: 4, defaultReps: 10, restTime: 90 },
      { exerciseId: EX.inclineBenchPress, defaultSets: 3, defaultReps: 12, restTime: 75 },
      { exerciseId: EX.shoulderPress, defaultSets: 3, defaultReps: 10, restTime: 75 },
      { exerciseId: EX.lateralRaise, defaultSets: 3, defaultReps: 15, restTime: 45 },
      { exerciseId: EX.tricepsPushdown, defaultSets: 3, defaultReps: 12, restTime: 45 },
      { exerciseId: EX.dip, defaultSets: 3, defaultReps: 10, restTime: 60 },
    ],
  },
  {
    name: 'Push / Pull / Legs — Pull A',
    description: 'Enfoque en espalda y bíceps',
    exercises: [
      { exerciseId: EX.deadlift, defaultSets: 3, defaultReps: 6, restTime: 120 },
      { exerciseId: EX.pullUp, defaultSets: 3, defaultReps: 8, restTime: 90 },
      { exerciseId: EX.bentOverRow, defaultSets: 4, defaultReps: 10, restTime: 75 },
      { exerciseId: EX.seatedRow, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.facePull, defaultSets: 3, defaultReps: 15, restTime: 45 },
      { exerciseId: EX.bicepCurl, defaultSets: 3, defaultReps: 12, restTime: 45 },
      { exerciseId: EX.hammerCurl, defaultSets: 3, defaultReps: 12, restTime: 45 },
    ],
  },
  {
    name: 'Push / Pull / Legs — Legs',
    description: 'Enfoque en piernas y glúteos',
    exercises: [
      { exerciseId: EX.squat, defaultSets: 4, defaultReps: 8, restTime: 120 },
      { exerciseId: EX.romanianDeadlift, defaultSets: 3, defaultReps: 10, restTime: 90 },
      { exerciseId: EX.legPress, defaultSets: 3, defaultReps: 12, restTime: 75 },
      { exerciseId: EX.legExtension, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.legCurl, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.calfRaise, defaultSets: 4, defaultReps: 15, restTime: 45 },
      { exerciseId: EX.walkingLunge, defaultSets: 3, defaultReps: 10, restTime: 60 },
    ],
  },
  {
    name: 'Weider — Pecho y Tríceps',
    description: 'Rutina clásica Weider: pecho + tríceps',
    exercises: [
      { exerciseId: EX.benchPress, defaultSets: 4, defaultReps: 10, restTime: 90 },
      { exerciseId: EX.inclineBenchPress, defaultSets: 3, defaultReps: 10, restTime: 75 },
      { exerciseId: EX.dumbbellFly, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.pushUp, defaultSets: 3, defaultReps: 15, restTime: 45 },
      { exerciseId: EX.skullCrusher, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.tricepsPushdown, defaultSets: 3, defaultReps: 15, restTime: 45 },
    ],
  },
  {
    name: 'Weider — Espalda y Bíceps',
    description: 'Rutina clásica Weider: espalda + bíceps',
    exercises: [
      { exerciseId: EX.pullUp, defaultSets: 3, defaultReps: 8, restTime: 90 },
      { exerciseId: EX.bentOverRow, defaultSets: 4, defaultReps: 10, restTime: 75 },
      { exerciseId: EX.latPulldown, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.seatedRow, defaultSets: 3, defaultReps: 12, restTime: 60 },
      { exerciseId: EX.reverseFly, defaultSets: 3, defaultReps: 15, restTime: 45 },
      { exerciseId: EX.bicepCurl, defaultSets: 3, defaultReps: 12, restTime: 45 },
      { exerciseId: EX.hammerCurl, defaultSets: 3, defaultReps: 12, restTime: 45 },
    ],
  },
  {
    name: 'Full Body — Principiante',
    description: 'Rutina de cuerpo completo 3x/semana',
    exercises: [
      { exerciseId: EX.squat, defaultSets: 3, defaultReps: 10, restTime: 90 },
      { exerciseId: EX.benchPress, defaultSets: 3, defaultReps: 10, restTime: 90 },
      { exerciseId: EX.bentOverRow, defaultSets: 3, defaultReps: 10, restTime: 75 },
      { exerciseId: EX.shoulderPress, defaultSets: 3, defaultReps: 10, restTime: 60 },
      { exerciseId: EX.bicepCurl, defaultSets: 2, defaultReps: 12, restTime: 45 },
      { exerciseId: EX.tricepsPushdown, defaultSets: 2, defaultReps: 12, restTime: 45 },
      { exerciseId: EX.plank, defaultSets: 3, defaultReps: 30, restTime: 30 },
    ],
  },
];
