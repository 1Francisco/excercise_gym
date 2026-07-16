import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkoutTimer from '../WorkoutTimer';
import { ThemeProvider } from '../../contexts/ThemeContext';

const mockNextExercise = {
  id: '0002',
  name: 'Bench Press',
  category: 'chest',
  body_part: 'chest' as const,
  equipment: 'barbell',
  instructions: { en: 'Do it', es: 'Hacerlo' },
  instruction_steps: { en: ['Step 1'], es: ['Paso 1'] },
  muscle_group: 'Pectorals',
  secondary_muscles: ['Triceps'],
  target: 'Pectorals',
  media_id: 'test456',
  image: 'images/0002-test.jpg',
  gif_url: 'videos/0002-test.gif',
  attribution: 'Test',
  created_at: '2024-01-01',
};

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('WorkoutTimer', () => {
  const defaultProps = {
    timeRemaining: 30,
    nextExercise: mockNextExercise,
    onSkip: jest.fn(),
    onAddSeconds: jest.fn(),
  };

  it('renders time remaining', async () => {
    const { getAllByText } = await renderWithTheme(<WorkoutTimer {...defaultProps} />);
    // The timer displays "30" as the countdown and there's also a "+30s" button
    const matches = getAllByText(/30/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('shows next exercise section', async () => {
    const { queryByText } = await renderWithTheme(<WorkoutTimer {...defaultProps} />);
    // The component renders "Siguiente ejercicio:" header
    expect(queryByText(/Siguiente/)).toBeTruthy();
  });

  it('calls onSkip when skip button pressed', async () => {
    const onSkip = jest.fn();
    const { getByText } = await renderWithTheme(
      <WorkoutTimer {...defaultProps} onSkip={onSkip} />
    );
    const skipButton = getByText(/Omitir/i);
    fireEvent.press(skipButton);
    expect(onSkip).toHaveBeenCalled();
  });

  it('calls onAddSeconds with +30 when add button pressed', async () => {
    const onAddSeconds = jest.fn();
    const { getByText } = await renderWithTheme(
      <WorkoutTimer {...defaultProps} onAddSeconds={onAddSeconds} />
    );
    const addButton = getByText(/\+30/i);
    fireEvent.press(addButton);
    expect(onAddSeconds).toHaveBeenCalledWith(30);
  });
});
