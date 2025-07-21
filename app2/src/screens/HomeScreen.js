import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '../constants/styles';
import DeviceCard from '../components/DeviceCard';
import { DEVICES } from '../constants/devices';


const HomeScreen = () => {
  return (
    <LinearGradient
      colors={['#0D0120', '#1A0833']}
      style={globalStyles.container}
    >
      <View style={{ paddingTop: 80 }}>
        <Text style={globalStyles.title}>Devices</Text>
        <FlatList
            data={DEVICES}
            keyExtractor={(item) => item.name}
            renderItem={({item}) => <DeviceCard device={item} />}
        />
      </View>
    </LinearGradient>
  );
};

export default HomeScreen;