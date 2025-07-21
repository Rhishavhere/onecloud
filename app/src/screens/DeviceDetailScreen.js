import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, Modal, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Progress from 'react-native-progress';
import { COLORS, globalStyles } from '../constants/styles';
import apiClient from '../api/axiosConfig';

const DeviceDetailScreen = ({ route }) => {
  // Get the specific device object passed from the navigation
  const { device } = route.params;

  // --- State Management ---
  const [status, setStatus] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [screenshotTimestamp, setScreenshotTimestamp] = useState(Date.now());

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      // Prepend the specific device endpoint to each API call
      const [statusRes, sysInfoRes, processesRes] = await Promise.all([
        apiClient.get(`${device.endpoint}/status`),
        apiClient.get(`${device.endpoint}/system-info`),
        apiClient.get(`${device.endpoint}/processes`),
      ]);
      setStatus(statusRes.data);
      setSysInfo(sysInfoRes.data);
      setProcesses(processesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      Alert.alert("Connection Error", `Could not connect to ${device.name}.`);
    } finally {
      if (loading) setLoading(false);
    }
  }, [loading, device.endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);

  const handleControlAction = async (action) => {
    const actionName = action.charAt(0).toUpperCase() + action.slice(1);
    Alert.alert(
      `Confirm ${actionName}`,
      `Are you sure you want to ${action} the ${device.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await apiClient.post(`${device.endpoint}/control/${action}`);
              Alert.alert("Success", `${actionName} command sent.`);
            } catch (error) {
              Alert.alert("Error", `Failed to send ${action} command.`);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleScreenshot = () => {
    setScreenshotTimestamp(Date.now());
    setScreenshotModalVisible(true);
  };

  // --- Render Functions ---
  const renderStatCard = (title, value) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderProcessItem = ({ item }) => (
    <View style={styles.processItem}>
      <Text style={styles.processName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.processMemory}>{item.memory_mb.toFixed(1)} MB</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accentPurple} />
        <Text style={{ color: COLORS.text, marginTop: 10 }}>Connecting to {device.name}...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accentPurple}
            colors={[COLORS.accentPurple, COLORS.accentGreen]}
          />
        }
      >
        <Text style={globalStyles.title}>{status?.hostname || device.name}</Text>

        {/* --- Status Section --- */}
        <View style={globalStyles.card}>
          <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
            <View style={styles.statGrid}>
              {renderStatCard('Status', status?.online ? 'Online' : 'Offline')}
              {renderStatCard('Uptime', status?.uptime)}
              {renderStatCard('OS', status?.os)}
            </View>
          </BlurView>
        </View>

        {/* --- System Info Section --- */}
        <View style={globalStyles.card}>
          <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
            <View style={styles.progressGrid}>
              <View style={styles.progressItem}>
                <Progress.Circle size={80} progress={sysInfo?.cpu.usage_percent / 100} showsText formatText={() => `${sysInfo?.cpu.usage_percent.toFixed(1)}%`} color={COLORS.accentPurple} unfilledColor="rgba(255,255,255,0.2)" borderWidth={0} thickness={8} />
                <Text style={styles.progressLabel}>CPU</Text>
              </View>
              <View style={styles.progressItem}>
                <Progress.Circle size={80} progress={sysInfo?.memory.usage_percent / 100} showsText formatText={() => `${sysInfo?.memory.usage_percent}%`} color={COLORS.accentGreen} unfilledColor="rgba(255,255,255,0.2)" borderWidth={0} thickness={8} />
                <Text style={styles.progressLabel}>Memory</Text>
              </View>
            </View>
          </BlurView>
        </View>

        {/* --- Controls Section --- */}
        <View style={globalStyles.card}>
          <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
            <Text style={globalStyles.subtitle}>Controls</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.button} onPress={handleScreenshot}>
                <Text style={styles.buttonText}>Screenshot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleControlAction('reboot')}>
                <Text style={styles.buttonText}>Reboot</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, { backgroundColor: COLORS.danger }]} onPress={() => handleControlAction('shutdown')}>
                <Text style={styles.buttonText}>Shutdown</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>

        {/* --- Processes Section --- */}
        <View style={globalStyles.card}>
          <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
            <Text style={globalStyles.subtitle}>Top Processes</Text>
            <FlatList
              data={processes.slice(0, 10)}
              renderItem={renderProcessItem}
              keyExtractor={(item) => item.pid.toString()}
              scrollEnabled={false}
            />
          </BlurView>
        </View>
      </ScrollView>

      {/* --- Screenshot Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={screenshotModalVisible}
        onRequestClose={() => setScreenshotModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Image
            source={{ uri: `${apiClient.defaults.baseURL}${device.endpoint}/screenshot?t=${screenshotTimestamp}` }}
            style={styles.screenshotImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setScreenshotModalVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
};

// --- Styles for this screen ---
const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statCard: { alignItems: 'center', flex: 1 },
    statTitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 4 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
    progressGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    progressItem: { alignItems: 'center' },
    progressLabel: { color: COLORS.text, marginTop: 10, fontWeight: '500' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, backgroundColor: COLORS.accentPurple, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
    processItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glass },
    processName: { color: COLORS.text, flex: 1, paddingRight: 10 },
    processMemory: { color: COLORS.textSecondary },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    screenshotImage: { width: '90%', height: '80%' },
    closeButton: { backgroundColor: COLORS.accentPurple, padding: 15, borderRadius: 10, marginTop: 20, width: '90%', alignItems: 'center' },
});

export default DeviceDetailScreen;