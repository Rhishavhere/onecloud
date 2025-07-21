import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons'; // Import icons

import HomeScreen from './src/screens/HomeScreen';
import DeviceDetailScreen from './src/screens/DeviceDetailScreen';
import AiScreen from './src/screens/AiScreen';
import KeysScreen from './src/screens/KeysScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { COLORS } from './src/constants/styles';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// A nested stack for the Home tab, so you can navigate from the list to details
function HomeStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
        </Stack.Navigator>
    );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
            } else if (route.name === 'AI') {
              iconName = focused ? 'sparkles' : 'sparkles-outline';
            } else if (route.name === 'Keys') {
                iconName = focused ? 'key' : 'key-outline';
            } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: COLORS.accentPurple,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.secondary,
            borderTopColor: COLORS.glass,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="AI" component={AiScreen} />
        <Tab.Screen name="Keys" component={KeysScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}