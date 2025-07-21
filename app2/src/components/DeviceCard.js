import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Progress from 'react-native-progress';
import { COLORS, globalStyles } from '../constants/styles';
import apiClient from '../api/axiosConfig';

const DeviceCard = ({ device }) => {
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiClient.get(`${device.baseUrl}${device.endpoint}/system-info`);
                setInfo(res.data);
            } catch (error) {
                console.log(`Could not fetch info for ${device.name}. Marking as offline.`);
                setInfo(null); // Set info to null to indicate offline status
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, [device]);

    // NEW: Handle press action based on device status
    const handlePress = () => {
        if (info) {
            // If we have info, the device is online, so navigate
            navigation.navigate('DeviceDetail', { device });
        } else {
            // Otherwise, show an alert notification
            Alert.alert(
                "Device Offline",
                `${device.name} is currently offline or unreachable.`,
                [{ text: "OK" }]
            );
        }
    };

    const ProgressBar = ({ label, progress, color }) => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>{label}</Text>
            <Progress.Bar progress={progress} width={null} color={color} unfilledColor={COLORS.glass} borderWidth={0} height={8} borderRadius={4} />
            <Text style={styles.progressText}>{(progress * 100).toFixed(0)}%</Text>
        </View>
    );

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={[globalStyles.card, { marginTop: 20 }]}>
                <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
                    <View style={styles.cardHeader}>
                        <Text style={globalStyles.subtitle}>{device.name}</Text>
                        <Text style={{ color: info ? COLORS.accentGreen : COLORS.danger }}>● {info ? 'Online' : 'Offline'}</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={COLORS.accentPurple} style={{marginVertical: 20}}/>
                    ) : info ? (
                        <View>
                            <ProgressBar label="CPU" progress={info.cpu.usage_percent / 100} color={COLORS.accentPurple} />
                            <ProgressBar label="RAM" progress={info.memory.usage_percent / 100} color={COLORS.accentGreen} />
                        </View>
                    ) : (
                        <Text style={{color: COLORS.textSecondary, textAlign: 'center', marginVertical: 20}}>Device is offline. Stats are unavailable.</Text>
                    )}
                </BlurView>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
    progressLabel: { color: COLORS.text, width: 35 },
    progressText: { color: COLORS.text, width: 40, textAlign: 'right' }
});

export default DeviceCard;