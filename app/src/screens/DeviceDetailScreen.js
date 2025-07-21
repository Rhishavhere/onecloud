import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Alert, Modal, Image, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'; // MODIFIED
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Progress from 'react-native-progress';
import { COLORS, globalStyles } from '../constants/styles';
import apiClient from '../api/axiosConfig';

const DeviceDetailScreen = () => {
  // --- State Management ---
  const [status, setStatus] = useState(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  const [screenshotTimestamp, setScreenshotTimestamp] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false); // NEW: State for pull-to-refresh

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    // Note: We don't set loading to true here because the refresh state handles the UI
    try {
      const [statusRes, sysInfoRes, processesRes] = await Promise.all([
        apiClient.get('/status'),
        apiClient.get('/system-info'),
        apiClient.get('/processes'),
      ]);
      setStatus(statusRes.data);
      setSysInfo(sysInfoRes.data);
      setProcesses(processesRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      Alert.alert("Connection Error", "Could not connect to the RhishDesk API. Make sure the server is running and the IP is correct.");
    } finally {
      // This ensures the initial loading spinner is turned off
      if(loading) setLoading(false);
    }
  }, [loading]); // 'loading' dependency is important for the finally block

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // NEW: Handler for the pull-to-refresh action
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  }, [fetchData]);


  // --- Handlers (handleControlAction, handleChat, handleScreenshot) remain the same ---
  const handleControlAction = async (action) => {
    const actionName = action.charAt(0).toUpperCase() + action.slice(1);
    Alert.alert(
      `Confirm ${actionName}`,
      `Are you sure you want to ${action} the desktop?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await apiClient.post(`/control/${action}`);
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

  const handleChat = async () => {
    if (!chatQuery.trim()) return;
    setChatLoading(true);
    setChatResponse('');
    try {
      const res = await apiClient.post('/chat', { query: chatQuery });
      setChatResponse(res.data.ai_response);
    } catch (error) {
      setChatResponse('Error: Could not get a response from the AI.');
    } finally {
      setChatLoading(false);
    }
  };

  const handleScreenshot = () => {
    setScreenshotTimestamp(Date.now()); // Bust cache by updating the timestamp
    setScreenshotModalVisible(true);
  };
  // --- Render Functions (renderStatCard, renderProcessItem) remain the same ---
  const renderStatCard = (title, value) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
  
  const renderProcessItem = ({ item }) => (
    <View style={styles.processItem}>
      <Text style={styles.processName}>{item.name}</Text>
      <Text style={styles.processMemory}>{item.memory_mb.toFixed(1)} MB</Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accentPurple} />
        <Text style={{color: COLORS.text, marginTop: 10}}>Connecting to Desktop...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 60, paddingBottom: 40 }}
        // MODIFIED: Add the refreshControl prop
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accentPurple}
            colors={[COLORS.accentPurple, COLORS.accentGreen]}
          />
        }
      >
        <Text style={globalStyles.title}>{status?.hostname || 'Desktop'}</Text>
        
        {/* --- All other sections (Status, System Info, Controls, etc.) remain exactly the same --- */}

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
                    <TouchableOpacity style={[styles.button, {backgroundColor: COLORS.danger}]} onPress={() => handleControlAction('shutdown')}>
                        <Text style={styles.buttonText}>Shutdown</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
        
        {/* --- AI Chat Section --- */}
        <View style={globalStyles.card}>
            <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
                <Text style={globalStyles.subtitle}>Chat with Gemini</Text>
                <TextInput
                    style={styles.textInput}
                    placeholder="e.g., is any game running?"
                    placeholderTextColor={COLORS.textSecondary}
                    value={chatQuery}
                    onChangeText={setChatQuery}
                />
                <TouchableOpacity style={styles.button} onPress={handleChat} disabled={chatLoading}>
                    <Text style={styles.buttonText}>{chatLoading ? 'Thinking...' : 'Ask AI'}</Text>
                </TouchableOpacity>
                {chatResponse ? <Text style={styles.aiResponse}>{chatResponse}</Text> : null}
            </BlurView>
        </View>

        {/* --- Processes Section --- */}
        <View style={globalStyles.card}>
            <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
                <Text style={globalStyles.subtitle}>Top Processes</Text>
                <FlatList
                    data={processes.slice(0, 10)} // Show top 10
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
            source={{ uri: `${apiClient.defaults.baseURL}/screenshot?t=${screenshotTimestamp}` }} 
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


// --- Styles for this screen (styles constant) remains the same ---
const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    statGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    statCard: { alignItems: 'center' },
    statTitle: { color: COLORS.textSecondary, fontSize: 14 },
    statValue: { color: COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 4 },
    progressGrid: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    progressItem: { alignItems: 'center' },
    progressLabel: { color: COLORS.text, marginTop: 10, fontWeight: '500' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    button: { flex: 1, backgroundColor: COLORS.accentPurple, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
    textInput: { backgroundColor: COLORS.glass, color: COLORS.text, borderRadius: 10, padding: 12, marginBottom: 10 },
    aiResponse: { color: COLORS.text, marginTop: 15, fontStyle: 'italic', backgroundColor: COLORS.glass, padding: 10, borderRadius: 8 },
    processItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.glass },
    processName: { color: COLORS.text },
    processMemory: { color: COLORS.textSecondary },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    screenshotImage: { width: '90%', height: '80%' },
    closeButton: { backgroundColor: COLORS.accentPurple, padding: 15, borderRadius: 10, marginTop: 20, width: '90%', alignItems: 'center' },
});

export default DeviceDetailScreen;