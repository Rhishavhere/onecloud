import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, globalStyles } from '../constants/styles';

const HomeScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      style={globalStyles.container}
    >
      <View style={{ paddingTop: 60 }}>
        <Text style={globalStyles.title}>RhishDesk</Text>
        <Text style={[globalStyles.title, { fontSize: 18, fontWeight: '400', color: COLORS.textSecondary }]}>
          Your Personal Cloud
        </Text>

        <TouchableOpacity onPress={() => navigation.navigate('DeviceDetail')}>
          <View style={[globalStyles.card, { marginTop: 40 }]}>
            <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
              <Text style={globalStyles.subtitle}>My Desktop</Text>
              <Text style={{ color: COLORS.accentGreen }}>● Connected</Text>
            </BlurView>
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default HomeScreen;