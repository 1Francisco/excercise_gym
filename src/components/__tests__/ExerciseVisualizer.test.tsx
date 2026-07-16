import React from 'react';
import { render } from '@testing-library/react-native';
import ExerciseVisualizer from '../ExerciseVisualizer';

describe('ExerciseVisualizer', () => {
  it('renders without crashing with an image path', async () => {
    const { getByTestId } = await render(
      <ExerciseVisualizer path="images/0001-test.jpg" type="image" />
    );
    // expo-image is mocked as a View with testID "expo-image"
    expect(getByTestId('expo-image')).toBeTruthy();
  });

  it('renders without crashing with a gif path', async () => {
    const { getByTestId } = await render(
      <ExerciseVisualizer path="videos/0001-test.gif" type="gif" />
    );
    expect(getByTestId('expo-image')).toBeTruthy();
  });

  it('uses high priority when passed', async () => {
    const { getByTestId } = await render(
      <ExerciseVisualizer path="images/test.jpg" type="image" priority="high" />
    );
    const image = getByTestId('expo-image');
    expect(image.props.priority).toBe('high');
  });

  it('renders without crashing', async () => {
    const { queryByTestId } = await render(
      <ExerciseVisualizer path="images/test.jpg" type="image" />
    );
    expect(queryByTestId('expo-image')).toBeTruthy();
  });
});
