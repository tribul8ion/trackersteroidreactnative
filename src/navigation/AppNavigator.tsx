import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import BottomTabsNavigator from './BottomTabsNavigator';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import AddEditCourseScreen from '../screens/AddEditCourseScreen';
import SignUpScreen from '../screens/SignUpScreen';
import LogInjectionScreen from '../screens/LogInjectionScreen';
import LogTabletScreen from '../screens/LogTabletScreen';
import LogNoteScreen from '../screens/LogNoteScreen';
import LabsScreen from '../screens/LabsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import AllAchievementsScreen from '../screens/AllAchievementsScreen';
import { AuthService } from '../services/auth';
import { AnalyticsService } from '../services/analytics';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  CourseDetail: { courseId: string };
  AddEditCourse: { course?: any } | undefined;
  SignUp: undefined;
  LogInjectionModal: { courseId: string; offSchedule?: boolean };
  LogTabletModal: { courseId: string; offSchedule?: boolean };
  LogNoteModal: { courseId: string };
  Labs: undefined;
  EditProfile: { profile: any };
  AllAchievements: undefined;
  Statistics: undefined;
  KnowledgeBase: undefined;
  Settings: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  isFirstLaunch: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ isFirstLaunch }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      // Отслеживаем статус аутентификации
      await AnalyticsService.trackEvent('auth_status_checked', {
        authenticated,
        isFirstLaunch,
      });
    } catch (error) {
      console.error('Ошибка проверки статуса аутентификации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitialRouteName = () => {
    if (isFirstLaunch) {
      return 'Splash';
    }
    return isAuthenticated ? 'Main' : 'Auth';
  };

  if (isLoading) {
    return null; // Показываем splash screen из App.tsx
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRouteName()}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={BottomTabsNavigator} />
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} />
        <Stack.Screen name="AddEditCourse" component={AddEditCourseScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="LogInjectionModal" component={LogInjectionScreen} options={{ presentation: 'transparentModal', headerShown: false }} />
        <Stack.Screen name="LogTabletModal" component={LogTabletScreen} options={{ presentation: 'transparentModal', headerShown: false }} />
        <Stack.Screen name="LogNoteModal" component={LogNoteScreen} options={{ presentation: 'transparentModal', headerShown: false }} />
        <Stack.Screen name="Labs" component={LabsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="AllAchievements" component={AllAchievementsScreen} />
        <Stack.Screen name="Statistics" component={require('../screens/StatisticsScreen').default} />
        <Stack.Screen name="KnowledgeBase" component={require('../screens/KnowledgeBaseScreen').default} />
        <Stack.Screen name="Settings" component={require('../screens/SettingsScreen').default} />
        <Stack.Screen name="Profile" component={require('../screens/ProfileScreen').default} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 