import { configure } from '@testing-library/react-native';
import { jest } from '@jest/globals';
import 'react-native-gesture-handler/jestSetup';

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

// Мок для react-native-gifted-charts
jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
  PieChart: 'PieChart',
  AreaChart: 'AreaChart',
}));

// Мок для react-native-paper
jest.mock('react-native-paper', () => ({
  Provider: 'Provider',
  Button: 'Button',
  TextInput: 'TextInput',
  Card: 'Card',
  Title: 'Title',
  Paragraph: 'Paragraph',
  Surface: 'Surface',
  List: 'List',
  IconButton: 'IconButton',
  FAB: 'FAB',
  Portal: 'Portal',
  Dialog: 'Dialog',
  ActivityIndicator: 'ActivityIndicator',
  Chip: 'Chip',
  Switch: 'Switch',
  RadioButton: 'RadioButton',
  Checkbox: 'Checkbox',
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
}));

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
}));

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

// Мок для Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
  };
});