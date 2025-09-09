import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import CoursesScreen from '../screens/CoursesScreen';
import HealthIndicatorsScreen from '../screens/HealthIndicatorsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LabsScreen from '../screens/LabsScreen';
import KnowledgeBaseScreen from '../screens/KnowledgeBaseScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const BottomTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 64,
          elevation: 0,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'home';
              break;
            case 'Courses':
              iconName = 'list-ul';
              break;
            case 'Labs':
              iconName = 'vial';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            case 'Knowledge':
              iconName = 'book';
              break;
            default:
              iconName = 'circle';
          }
          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome5
                name={iconName as any}
                size={22}
                color={focused ? colors.accent : colors.gray}
                solid
              />
              {focused && (
                <View
                  style={{
                    height: 3,
                    width: 24,
                    backgroundColor: colors.accent,
                    borderRadius: 2,
                    marginTop: 4,
                  }}
                />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
      />
      <Tab.Screen
        name="Courses"
        component={CoursesScreen}
      />
      <Tab.Screen
        name="Knowledge"
        component={KnowledgeBaseScreen}
        options={{
          tabBarLabel: 'Знания',
        }}
      />
      <Tab.Screen
        name="Labs"
        component={LabsScreen}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    top: -32,
    alignSelf: 'center',
    zIndex: 10,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

export default BottomTabsNavigator; 