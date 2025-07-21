import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
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
                const res = await apiClient.get(`${device.endpoint}/system-info`);
                setInfo(res.data);
            } catch (error) {
                console.log(`Could not fetch info for ${device.name}`);
                setInfo(null); // Clear info on error
            } finally {
                setLoading(false);
            }
        };

        fetchData(); // Fetch immediately
        const interval = setInterval(fetchData, 15000); // And then every 15 seconds
        return () => clearInterval(interval); // Cleanup on unmount
    }, [device]);

    const ProgressBar = ({ label, progress, color }) => (
        <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>{label}</Text>
            <Progress.Bar progress={progress} width={null} color={color} unfilledColor={COLORS.glass} borderWidth={0} height={8} borderRadius={4} />
            <Text style={styles.progressText}>{(progress * 100).toFixed(0)}%</Text>
        </View>
    );

    return (
        <TouchableOpacity onPress={() => navigation.navigate('DeviceDetail', { device })}>
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
                        <Text style={{color: COLORS.textSecondary, textAlign: 'center', marginVertical: 20}}>Could not retrieve device stats.</Text>
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