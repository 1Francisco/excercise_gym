import { Vibration } from 'react-native';
import { notifyRestEnd } from '../notifications';

describe('notifyRestEnd', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls Vibration.vibrate when doNotDisturb is false', () => {
    notifyRestEnd(false);
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 200, 100, 200]);
  });

  it('does nothing when doNotDisturb is true', () => {
    notifyRestEnd(true);
    expect(Vibration.vibrate).not.toHaveBeenCalled();
  });

  it('does not throw when doNotDisturb is undefined', () => {
    expect(() => notifyRestEnd()).not.toThrow();
  });
});
