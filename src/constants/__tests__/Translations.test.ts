import { translateMuscle, translateEquipment, translateExerciseName } from '../Translations';

describe('translateMuscle', () => {
  it('returns spanish translation for english muscle name', () => {
    expect(translateMuscle('chest')).toBe('Pecho');
    expect(translateMuscle('back')).toBe('Espalda');
    expect(translateMuscle('shoulders')).toBe('Hombros');
    expect(translateMuscle('upper legs')).toBe('Piernas');
    expect(translateMuscle('upper arms')).toBe('Brazos');
    expect(translateMuscle('lower legs')).toBe('Pantorrillas');
    expect(translateMuscle('lower arms')).toBe('Antebrazos');
    expect(translateMuscle('waist')).toBe('Abdomen / Cintura');
    expect(translateMuscle('neck')).toBe('Cuello');
    expect(translateMuscle('cardio')).toBe('Cardio');
  });

  it('returns unknown for unmapped body part', () => {
    expect(translateMuscle('unknown_muscle')).toBe('unknown_muscle');
  });
});

describe('translateEquipment', () => {
  it('returns spanish translation for english equipment', () => {
    expect(translateEquipment('body weight')).toBe('Peso corporal');
    expect(translateEquipment('dumbbell')).toBe('Mancuerna');
    expect(translateEquipment('barbell')).toBe('Barra');
    expect(translateEquipment('kettlebell')).toBe('Pesa rusa / Kettlebell');
    expect(translateEquipment('cable')).toBe('Polea');
    expect(translateEquipment('band')).toBe('Banda elástica');
    expect(translateEquipment('medicine ball')).toBe('Balón medicinal');
  });

  it('returns unknown for unmapped equipment', () => {
    expect(translateEquipment('unknown_equipment')).toBe('unknown_equipment');
  });
});

describe('translateExerciseName', () => {
  it('translates exercise name to spanish', () => {
    expect(translateExerciseName('Push Up')).toBe('Empuje up');
  });

  it('returns empty string for empty input', () => {
    expect(translateExerciseName('')).toBe('');
  });
});
