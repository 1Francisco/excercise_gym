// ─── AsyncStorage Mock ─────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((key) => Promise.resolve(store[key] || null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve(null);
      }),
      removeItem: jest.fn((key) => {
        delete store[key];
        return Promise.resolve(null);
      }),
      clear: jest.fn(() => {
        Object.keys(store).forEach((k) => delete store[k]);
        return Promise.resolve(null);
      }),
      getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    },
  };
});

// ─── Expo Modules Mock ─────────────────────────────────
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, ...props, testID: props.testID || 'expo-image' })
    ),
    ImageBackground: React.forwardRef((props, ref) =>
      React.createElement(View, { ref, ...props, testID: props.testID || 'expo-image-background' })
    ),
  };
});

jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn(() => ({
      loadAsync: jest.fn(),
      playAsync: jest.fn(),
      unloadAsync: jest.fn(),
    })),
    setAudioModeAsync: jest.fn(),
  },
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium' },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  Link: ({ children, ...props }) => {
    const React = require('react');
    const { Pressable } = require('react-native');
    return React.createElement(Pressable, { ...props }, children);
  },
  Stack: {
    Screen: () => null,
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-camera', () => ({
  CameraView: ({ children }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, null, children);
  },
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchCameraAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'test-camera.jpg' }] })
  ),
  launchImageLibraryAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'test-library.jpg' }] })
  ),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(() =>
    Promise.resolve({ canceled: false, assets: [{ uri: 'test.json' }] })
  ),
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    write: jest.fn(),
    textSync: jest.fn(() => '{}'),
    uri: 'test-uri',
    delete: jest.fn(),
    exists: true,
  })),
  Paths: { cache: '/cache', document: '/documents', bundle: '/bundle' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  DailyTriggerInput: {},
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
  AndroidImportance: { DEFAULT: 3 },
}));

jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: { GymWidget: { updateWidget: jest.fn() } },
}));

// ─── React Native Reanimated Mock ───────────────────────
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    default: Reanimated.default,
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue, _, cb) => {
      cb?.(true);
      return toValue;
    }),
    withSpring: jest.fn((toValue) => toValue),
    FadeIn: {},
    FadeOut: {},
  };
});

// ─── Lucide React Native Mock ───────────────────────────
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  const mockIcon = (name) => {
    const Comp = React.forwardRef((props, ref) =>
      React.createElement(View, { ref, ...props, testID: `icon-${name}` },
        React.createElement(Text, null, name)
      )
    );
    Comp.displayName = name;
    return Comp;
  };

  const icons = [
    'Activity', 'AlertTriangle', 'Apple', 'Award', 'BarChart3', 'Bell', 'BellOff',
    'Calculator', 'Calendar', 'Camera', 'Check', 'ChevronDown', 'ChevronLeft',
    'ChevronRight', 'ChevronUp', 'Copy', 'Droplets', 'Dumbbell', 'Edit3',
    'Flame', 'Image', 'Info', 'Lightbulb', 'Minus', 'Pause', 'Play', 'Plus',
    'PlusCircle', 'RefreshCw', 'Ruler', 'Save', 'Scale', 'Scan', 'Search',
    'Settings2', 'Share2', 'Sparkles', 'Square', 'Target', 'Trash2', 'Trophy',
    'User', 'X', 'Zap', 'ZapOff', 'Ruler',
  ];

  const exports = {};
  icons.forEach((name) => {
    exports[name] = mockIcon(name);
  });
  exports.default = {};
  return exports;
});

// ─── SafeAreaContext Mock ───────────────────────────────
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View, StatusBar } = require('react-native');
  return {
    SafeAreaProvider: ({ children }) => React.createElement(View, null, children),
    SafeAreaView: ({ children, style }) => React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// ─── react-native-gesture-handler Mock ──────────────────
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children }) => React.createElement(View, null, children),
    Swipeable: ({ children }) => React.createElement(View, null, children),
    State: {},
    PanGestureHandler: ({ children }) => React.createElement(View, null, children),
    TapGestureHandler: ({ children }) => React.createElement(View, null, children),
    LongPressGestureHandler: ({ children }) => React.createElement(View, null, children),
    PinchGestureHandler: ({ children }) => React.createElement(View, null, children),
    RotationGestureHandler: ({ children }) => React.createElement(View, null, children),
    FlingGestureHandler: ({ children }) => React.createElement(View, null, children),
    NativeViewGestureHandler: ({ children }) => React.createElement(View, null, children),
    ScrollView: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    FlatList: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    RectButton: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    BorderlessButton: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    BaseButton: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    TouchableOpacity: ({ children, ...props }) => React.createElement(View, { ...props }, children),
    gestureHandlerRootHOC: (Component) => Component,
  };
});

// ─── react-native-screens Mock ─────────────────────────
jest.mock('react-native-screens', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Screen: ({ children }) => React.createElement(View, null, children),
    ScreenStack: ({ children }) => React.createElement(View, null, children),
    ScreenStackHeaderConfig: () => null,
    ScreenStackHeaderTitleView: () => null,
    ScreenStackHeaderRightView: () => null,
    ScreenStackHeaderLeftView: () => null,
    SearchBar: () => null,
    enableScreens: jest.fn(),
    useTransitionProgress: () => ({ progress: { value: 0 } }),
  };
});

// ─── react-native-svg Mock ─────────────────────────────
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Svg: ({ children }) => React.createElement(View, null, children),
    Rect: () => null,
    Circle: () => null,
    Line: () => null,
    Path: () => null,
    Text: () => null,
    G: ({ children }) => React.createElement(View, null, children),
    Defs: ({ children }) => React.createElement(View, null, children),
    LinearGradient: () => null,
    Stop: () => null,
  };
});

// ─── react-native-worklets Mock ────────────────────────
jest.mock('react-native-worklets', () => ({
  createWorklet: jest.fn((fn) => fn),
}));

// ─── Setup @testing-library/react-native matchers ───────
// jest-native matchers are built-in in @testing-library/react-native v12+
// Just extend expect with common matchers
if (typeof expect !== 'undefined') {
expect.extend({
  toBeOnTheScreen: (received) => {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () => `expected element${pass ? ' not' : ''} to be on the screen`,
    };
  },
  toHaveTextContent: (received, text) => {
    const props = received?.props || {};
    const children = props.children || '';
    const content = typeof children === 'string' ? children : '';
    const pass = content.includes(text);
    return {
      pass,
      message: () =>
        `expected element${pass ? ' not' : ''} to have text content "${text}"`,
    };
  },
});
}
