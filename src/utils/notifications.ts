import { Vibration } from 'react-native';

let Audio: any = null;

async function getAudio() {
  if (!Audio) {
    try {
      const module = await import('expo-av');
      Audio = module.Audio;
    } catch {
      return null;
    }
  }
  return Audio;
}

export async function playRestEndSound() {
  try {
    const audio = await getAudio();
    if (!audio) return;

    const { sound } = await audio.Sound.createAsync(
      { uri: 'https://raw.githubusercontent.com/ievenight/exercises-dataset/master/sounds/beep.mp3' },
      { shouldPlay: true, volume: 0.5 }
    );
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Silently fail — sound is optional
  }
}

export function vibrateRestEnd() {
  Vibration.vibrate([0, 200, 100, 200]);
}

export function notifyRestEnd(doNotDisturb?: boolean) {
  if (doNotDisturb) return;
  playRestEndSound();
  vibrateRestEnd();
}
