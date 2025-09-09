import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
// import { initDb } from './src/services/db'; // Удалено, больше не нужно

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
