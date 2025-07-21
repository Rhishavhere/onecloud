import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, globalStyles } from '../constants/styles';

const KeysScreen = () => (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={[globalStyles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text style={globalStyles.title}>Keys & Secrets</Text>
        <Text style={{color: COLORS.textSecondary}}>Coming soon...</Text>
    </LinearGradient>
);

export default KeysScreen;