import { configure } from '@testing-library/react-native';
// RNGH: minimal stub for tests (avoid requiring native jestSetup)
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  PanGestureHandler: 'PanGestureHandler',
  TapGestureHandler: 'TapGestureHandler',
  LongPressGestureHandler: 'LongPressGestureHandler',
  FlingGestureHandler: 'FlingGestureHandler',
  ForceTouchGestureHandler: 'ForceTouchGestureHandler',
  NativeViewGestureHandler: 'NativeViewGestureHandler',
  PinchGestureHandler: 'PinchGestureHandler',
  RotationGestureHandler: 'RotationGestureHandler',
  Swipeable: 'Swipeable',
  DrawerLayout: 'DrawerLayout',
  State: {},
  Directions: {},
}));
import { Alert } from 'react-native';
import '@testing-library/jest-native/extend-expect';
import * as LocalStorageModule from '../services/localStorage';

// Настройка тестового окружения
configure({
  asyncUtilTimeout: 10000,
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    error.stack = null;
    return error;
  }
});

// Моки для нативных модулей
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([1, 2, 3])),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

// Мок для react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = (callback, ...args) => callback(...args);
  return Reanimated;
});

// RN 0.79: avoid TurboModule DevMenu errors in JSDOM
jest.mock('react-native/src/private/devmenu/DevMenu', () => ({}));

// Мок для react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  AreaChart: 'AreaChart',
}));

// Мок для react-native-paper
jest.mock('react-native-paper', () => {
  const React = require('react');
  const passthrough = (name) => React.forwardRef((props, ref) => React.createElement(name, { ref, ...props }, props.children));
  return {
    Provider: passthrough('Provider'),
    Button: passthrough('Button'),
    TextInput: passthrough('TextInput'),
    Card: passthrough('Card'),
    Title: passthrough('Title'),
    Paragraph: passthrough('Paragraph'),
    Surface: passthrough('Surface'),
    List: passthrough('List'),
    IconButton: passthrough('IconButton'),
    FAB: passthrough('FAB'),
    Portal: passthrough('Portal'),
    Dialog: passthrough('Dialog'),
    ActivityIndicator: passthrough('ActivityIndicator'),
    Chip: passthrough('Chip'),
    RadioButton: passthrough('RadioButton'),
    Checkbox: passthrough('Checkbox'),
    Switch: React.forwardRef((props, ref) => React.createElement('Switch', { ref, ...props })),
    useTheme: () => ({
      colors: {
        primary: '#2196F3',
        secondary: '#FFC107',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#212121',
        error: '#F44336',
        success: '#4CAF50',
        warning: '#FF9800',
      },
    }),
  };
});

// Мок для react-navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  NavigationContainer: ({ children }: any) => children,
}));
// Mock native-stack to avoid requiring real navigator factory
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: ({ children }: any) => children }),
}));

try {
  jest.mock('@react-navigation/stack', () => ({
    createStackNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: ({ children }: any) => children }),
  }));
} catch {}
try {
  jest.mock('@react-navigation/bottom-tabs', () => ({
    createBottomTabNavigator: () => ({ Navigator: ({ children }: any) => children, Screen: ({ children }: any) => children }),
  }));
} catch {}

// Мок для react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: 'SafeAreaProvider',
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Глобальные моки
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Spy for Alert and LocalStorageService on every test (restoreMocks is enabled)
beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(LocalStorageModule.LocalStorageService as any, 'getItem');
  jest.spyOn(LocalStorageModule.LocalStorageService as any, 'setItem');
  jest.spyOn(LocalStorageModule.LocalStorageService as any, 'removeItem');
});