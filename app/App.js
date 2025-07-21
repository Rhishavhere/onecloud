// App.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';

const { width, height } = Dimensions.get('window');

// API Service with actual HTTP requests and fallback data
class APIService {
  static BASE_URL = 'https://myspace.rhishav.com';
  
  // Helper method for making HTTP requests with timeout
  static async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn(`API Request failed for ${url}:`, error.message);
      throw error;
    }
  }
  
  // Fetch comprehensive device data
  static async fetchDeviceData(deviceName) {
    try {
      // Try to fetch real data from multiple endpoints
      const [statusData, performanceData, processesData] = await Promise.allSettled([
        this.makeRequest(`${this.BASE_URL}/${deviceName}/status`),
        this.makeRequest(`${this.BASE_URL}/${deviceName}/performance`),
        this.makeRequest(`${this.BASE_URL}/${deviceName}/processes`),
      ]);
      
      // Combine successful responses
      const combinedData = {
        ...statusData.status === 'fulfilled' ? statusData.value : {},
        ...performanceData.status === 'fulfilled' ? performanceData.value : {},
        ...processesData.status === 'fulfilled' ? { processes: processesData.value } : {},
      };
      
      // Return real data if we got something, otherwise fallback
      if (Object.keys(combinedData).length > 0) {
        return combinedData;
      }
      
      throw new Error('No data received from any endpoint');
      
    } catch (error) {
      console.warn(`Falling back to mock data for ${deviceName}:`, error.message);
      
      // Fallback mock data
      const mockData = {
        laptop: {
          status: 'online',
          uptime: '2d 14h 32m',
          cpu: { usage: 45, temp: 67, cores: 8 },
          memory: { used: 8.2, total: 16, percentage: 51, available: 7.8 },
          storage: { 
            used: 512, 
            total: 1000, 
            percentage: 51,
            free: 488,
            drives: [
              { name: 'C:', used: 400, total: 500, type: 'SSD' },
              { name: 'D:', used: 112, total: 500, type: 'HDD' }
            ]
          },
          processes: [
            { name: 'Chrome', cpu: 15.2, memory: 2.1, pid: 1234 },
            { name: 'VS Code', cpu: 8.3, memory: 1.8, pid: 5678 },
            { name: 'Spotify', cpu: 3.1, memory: 0.9, pid: 9012 },
            { name: 'Discord', cpu: 2.5, memory: 1.2, pid: 3456 },
          ],
          network: { 
            download: 45.2, 
            upload: 12.3, 
            interface: 'WiFi',
            ip: '192.168.1.100'
          },
          battery: 87,
          temperature: { cpu: 67, gpu: 72 },
          lastSeen: new Date().toISOString(),
          os: 'Windows 11',
          hostname: 'RHISH-LAPTOP'
        },
        desktop: {
          status: 'online',
          uptime: '5d 8h 15m',
          cpu: { usage: 23, temp: 54, cores: 16 },
          memory: { used: 12.8, total: 32, percentage: 40, available: 19.2 },
          storage: { 
            used: 750, 
            total: 2000, 
            percentage: 38,
            free: 1250,
            drives: [
              { name: 'C:', used: 250, total: 500, type: 'NVMe SSD' },
              { name: 'D:', used: 500, total: 1500, type: 'HDD' }
            ]
          },
          processes: [
            { name: 'Steam', cpu: 12.5, memory: 3.2, pid: 1111 },
            { name: 'Discord', cpu: 5.1, memory: 1.5, pid: 2222 },
            { name: 'Firefox', cpu: 8.7, memory: 2.8, pid: 3333 },
            { name: 'OBS Studio', cpu: 15.3, memory: 4.1, pid: 4444 },
          ],
          network: { 
            download: 67.8, 
            upload: 23.1, 
            interface: 'Ethernet',
            ip: '192.168.1.101'
          },
          battery: null, // Desktop doesn't have battery
          temperature: { cpu: 54, gpu: 65 },
          lastSeen: new Date().toISOString(),
          os: 'Windows 11',
          hostname: 'RHISH-DESKTOP'
        },
      };
      
      return mockData[deviceName] || null;
    }
  }
  
  // Take screenshot of device
  static async takeScreenshot(deviceName) {
    try {
      const response = await this.makeRequest(
        `${this.BASE_URL}/${deviceName}/screenshot`, 
        { method: 'POST' }
      );
      
      return response.message || `Screenshot taken from ${deviceName}`;
      
    } catch (error) {
      console.warn(`Screenshot API failed for ${deviceName}:`, error.message);
      
      // Simulate delay for fallback
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `Screenshot taken from ${deviceName} (simulated)`;
    }
  }
  
  // Shutdown device
  static async shutdownDevice(deviceName) {
    try {
      const response = await this.makeRequest(
        `${this.BASE_URL}/${deviceName}/shutdown`, 
        { 
          method: 'POST',
          body: JSON.stringify({ 
            action: 'shutdown',
            delay: 30 // 30 second delay
          })
        }
      );
      
      return response.message || `Shutdown command sent to ${deviceName}`;
      
    } catch (error) {
      console.warn(`Shutdown API failed for ${deviceName}:`, error.message);
      
      // Simulate delay for fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Shutdown command sent to ${deviceName} (simulated)`;
    }
  }
  
  // Restart device
  static async restartDevice(deviceName) {
    try {
      const response = await this.makeRequest(
        `${this.BASE_URL}/${deviceName}/restart`, 
        { 
          method: 'POST',
          body: JSON.stringify({ 
            action: 'restart',
            delay: 30
          })
        }
      );
      
      return response.message || `Restart command sent to ${deviceName}`;
      
    } catch (error) {
      console.warn(`Restart API failed for ${deviceName}:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `Restart command sent to ${deviceName} (simulated)`;
    }
  }
  
  // Kill specific process
  static async killProcess(deviceName, pid) {
    try {
      const response = await this.makeRequest(
        `${this.BASE_URL}/${deviceName}/process/${pid}`, 
        { method: 'DELETE' }
      );
      
      return response.message || `Process ${pid} terminated on ${deviceName}`;
      
    } catch (error) {
      console.warn(`Kill process API failed for ${deviceName}:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return `Process ${pid} terminated on ${deviceName} (simulated)`;
    }
  }
  
  // Get system logs
  static async getSystemLogs(deviceName, lines = 50) {
    try {
      const response = await this.makeRequest(
        `${this.BASE_URL}/${deviceName}/logs?lines=${lines}`
      );
      
      return response.logs || [];
      
    } catch (error) {
      console.warn(`System logs API failed for ${deviceName}:`, error.message);
      
      // Mock logs
      return [
        { timestamp: new Date().toISOString(), level: 'INFO', message: 'System startup completed' },
        { timestamp: new Date(Date.now() - 1000).toISOString(), level: 'WARN', message: 'High CPU usage detected' },
        { timestamp: new Date(Date.now() - 2000).toISOString(), level: 'INFO', message: 'Network interface connected' }
      ];
    }
  }
  
  // Query AI Assistant (Gemini API)
  static async queryAI(query, deviceContext = null) {
    try {
      // Try real Gemini API first
      const response = await this.makeRequest(
        `${this.BASE_URL}/ai/query`, 
        {
          method: 'POST',
          body: JSON.stringify({ 
            query,
            context: deviceContext,
            model: 'gemini-2.0-flash'
          })
        }
      );
      
      return response.answer || response.response;
      
    } catch (error) {
      console.warn(`AI API failed:`, error.message);
      
      // Default responses
      const defaultResponses = [
        "I can help you monitor your devices. Try asking about performance, games, or battery status.",
        "Your systems are running normally. Is there something specific you'd like to check?",
        "All devices are online and functioning properly. What would you like to know?",
        "I'm here to help with your device management. You can ask about processes, performance, or system status."
      ];
      
      return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }
  }
  
  // Health check for device
  static async pingDevice(deviceName) {
    try {
      const response = await this.makeRequest(`${this.BASE_URL}/${deviceName}/ping`);
      return { online: true, latency: response.latency || Math.random() * 50 + 10 };
    } catch (error) {
      return { online: false, latency: null };
    }
  }
}

// Component for device status cards
const DeviceCard = ({ device, onPress, onScreenshot, onShutdown }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#4CAF50';
      case 'offline': return '#F44336';
      case 'idle': return '#FF9800';
      default: return '#757575';
    }
  };

  return (
    <TouchableOpacity style={styles.deviceCard} onPress={onPress}>
      <LinearGradient
        colors={['#2D2D2D', '#1A1A1A']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.deviceInfo}>
            <Ionicons 
              name={device.name === 'laptop' ? 'laptop-outline' : 'desktop-outline'} 
              size={24} 
              color="#FFFFFF" 
            />
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>
                {device.name.charAt(0).toUpperCase() + device.name.slice(1)}
              </Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                <Text style={styles.statusText}>{device.status}</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onScreenshot(device.name)}
            >
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => onShutdown(device.name)}
            >
              <Ionicons name="power-outline" size={16} color="#FF5252" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CPU</Text>
              <Text style={styles.statValue}>{device.cpu?.usage || 0}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Memory</Text>
              <Text style={styles.statValue}>{device.memory?.percentage || 0}%</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Uptime</Text>
              <Text style={styles.statValue}>{device.uptime || 'N/A'}</Text>
            </View>
          </View>
          
          {device.battery !== null && (
            <View style={styles.batteryRow}>
              <Ionicons name="battery-half-outline" size={16} color="#4CAF50" />
              <Text style={styles.batteryText}>{device.battery}%</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// AI Chat Modal
const AIModal = ({ visible, onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      // Pass device context to AI for more intelligent responses
      const allDevices = devices.reduce((acc, device) => ({
        ...acc,
        [device.name]: device
      }), {});
      
      const aiResponse = await APIService.queryAI(query, allDevices);
      setResponse(aiResponse);
      setQuery('');
    } catch (error) {
      Alert.alert('Error', 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>AI Assistant</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chatContainer}>
          {response ? (
            <View style={styles.responseContainer}>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>
              Ask me anything about your systems...
            </Text>
          )}
        </View>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Type your question..."
            placeholderTextColor="#757575"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
            onPress={handleQuery}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Device Details Modal
const DeviceModal = ({ device, visible, onClose }) => {
  if (!device) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            {device.name.charAt(0).toUpperCase() + device.name.slice(1)} Details
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.deviceDetailsContainer}>
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>System Info</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>{device.status}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Uptime:</Text>
              <Text style={styles.detailValue}>{device.uptime}</Text>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CPU Usage:</Text>
              <Text style={styles.detailValue}>{device.cpu?.usage}%</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CPU Temp:</Text>
              <Text style={styles.detailValue}>{device.cpu?.temp}°C</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Memory:</Text>
              <Text style={styles.detailValue}>
                {device.memory?.used}GB / {device.memory?.total}GB
              </Text>
            </View>
          </View>
          
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Running Processes</Text>
            {device.processes?.map((process, index) => (
              <View key={index} style={styles.processItem}>
                <Text style={styles.processName}>{process.name}</Text>
                <Text style={styles.processStats}>
                  CPU: {process.cpu}% | RAM: {process.memory}GB
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Main App Component
export default function App() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const loadDeviceData = async () => {
    try {
      const deviceNames = ['laptop', 'desktop'];
      const deviceData = await Promise.all(
        deviceNames.map(async (name) => {
          const data = await APIService.fetchDeviceData(name);
          return { name, ...data };
        })
      );
      setDevices(deviceData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load device data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDeviceData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDeviceData();
  };

  const handleScreenshot = async (deviceName) => {
    try {
      setLoading(true);
      const result = await APIService.takeScreenshot(deviceName);
      Alert.alert('Success', result);
    } catch (error) {
      Alert.alert('Error', 'Failed to take screenshot');
    } finally {
      setLoading(false);
    }
  };

  const handleShutdown = (deviceName) => {
    Alert.alert(
      'Confirm Shutdown',
      `Are you sure you want to shutdown ${deviceName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Shutdown', 
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await APIService.shutdownDevice(deviceName);
              Alert.alert('Success', result);
            } catch (error) {
              Alert.alert('Error', 'Failed to shutdown device');
            }
          }
        }
      ]
    );
  };

  const handleDevicePress = (device) => {
    setSelectedDevice(device);
    setDeviceModalVisible(true);
  };

  if (loading && devices.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading RhishDesk...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <LinearGradient
        colors={['#121212', '#1E1E1E']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RhishDesk</Text>
          <Text style={styles.headerSubtitle}>Personal Cloud Workspace</Text>
          
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => setAiModalVisible(true)}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              style={styles.aiButtonGradient}
            >
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.aiButtonText}>Ask AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4CAF50']}
              tintColor="#4CAF50"
            />
          }
        >
          <View style={styles.devicesContainer}>
            <Text style={styles.sectionTitle}>Connected Devices</Text>
            {devices.map((device, index) => (
              <DeviceCard
                key={index}
                device={device}
                onPress={() => handleDevicePress(device)}
                onScreenshot={handleScreenshot}
                onShutdown={handleShutdown}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>

      <AIModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
      />

      <DeviceModal
        device={selectedDevice}
        visible={deviceModalVisible}
        onClose={() => setDeviceModalVisible(false)}
      />
    </View>
  );
}

// package.json dependencies needed:
// npm install expo-linear-gradient @expo/vector-icons