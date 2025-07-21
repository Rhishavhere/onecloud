import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, globalStyles } from '../constants/styles';

const SettingsScreen = () => (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={[globalStyles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={globalStyles.title}>Settings</Text>
    </LinearGradient>
);

export default SettingsScreen;