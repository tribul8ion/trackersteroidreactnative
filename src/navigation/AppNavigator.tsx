import React from 'react';
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
// import AllAchievementsScreen from '../screens/AllAchievementsScreen';

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
  EditProfile: { profile: import('../services/profile').Profile };
  // AllAchievements: undefined; // временно скрыто
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
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
        {/* <Stack.Screen name="AllAchievements" component={AllAchievementsScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 