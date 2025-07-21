import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { globalStyles } from '../constants/styles';
import DeviceCard from '../components/DeviceCard';

// For now, we hardcode the devices. This could come from a config or API later.
const DEVICES = [
    { name: 'My Desktop', endpoint: '/desktop' },
    // { name: 'My Laptop', endpoint: '/laptop' }, // When you add the laptop API
];

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