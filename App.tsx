import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';
import { LocalStorageService } from './src/services/localStorage';
import { AuthService } from './src/services/auth';
import { AnalyticsService } from './src/services/analytics';

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Инициализация локального хранилища
      await LocalStorageService.initialize();
      
      // Инициализация сервиса аутентификации
      await AuthService.initialize();
      
      // Инициализация аналитики
      await AnalyticsService.initialize();
      
      // Проверка первого запуска
      const firstLaunch = await LocalStorageService.isFirstLaunch();
      setIsFirstLaunch(firstLaunch);
      
      if (firstLaunch) {
        // Отмечаем, что первый запуск завершен
        await LocalStorageService.markFirstLaunchComplete();
      }
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Ошибка инициализации приложения:', error);
      setIsInitialized(true); // Все равно показываем приложение
    }
  };

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: colors.background 
        }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ 
            color: colors.white, 
            marginTop: 16, 
            fontSize: 16 
          }}>
            Инициализация...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider>
        <StatusBar style="light" />
        <AppNavigator isFirstLaunch={isFirstLaunch} />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
export { App };
