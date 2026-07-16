import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import ExerciseCard from '../ExerciseCard';
import { ThemeProvider } from '../../contexts/ThemeContext';

const mockExercise = {
  id: '0001',
  name: 'Push Up',
  category: 'chest',
  body_part: 'chest' as const,
  equipment: 'body weight',
  instructions: { en: 'Do push up', es: 'Hacer lagartijas' },
  instruction_steps: { en: ['Step 1'], es: ['Paso 1'] },
  muscle_group: 'Pectorals',
  secondary_muscles: ['Triceps', 'Shoulders'],
  target: 'Pectorals',
  media_id: 'test123',
  image: 'images/0001-test.jpg',
  gif_url: 'videos/0001-test.gif',
  attribution: 'Test',
  created_at: '2024-01-01',
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ExerciseCard', () => {
  it('renders exercise name and badges', async () => {
    const { getByText } = await renderWithTheme(<ExerciseCard exercise={mockExercise} />);
    // Exercise name is translated via translateExerciseName
    expect(getByText(/Empuje/i)).toBeTruthy();
    expect(getByText('Pecho')).toBeTruthy();
    expect(getByText('Peso corporal')).toBeTruthy();
  });

  it('renders chevron icon by default', async () => {
    const { queryByTestId } = await renderWithTheme(<ExerciseCard exercise={mockExercise} />);
    expect(queryByTestId('icon-ChevronRight')).toBeTruthy();
  });

  it('renders rightElement instead of chevron when provided', async () => {
    const { queryByTestId } = await renderWithTheme(
      <ExerciseCard exercise={mockExercise} rightElement={<View testID="custom-element" />} />
    );
    expect(queryByTestId('icon-ChevronRight')).toBeNull();
    expect(queryByTestId('custom-element')).toBeTruthy();
  });

  it('triggers onPress when provided', async () => {
    const onPress = jest.fn();
    const { getByText } = await renderWithTheme(
      <ExerciseCard exercise={mockExercise} onPress={onPress} />
    );
    fireEvent.press(getByText(/Empuje/i));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
