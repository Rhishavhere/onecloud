import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, globalStyles } from '../constants/styles';
import { DEVICES } from '../constants/devices';
import apiClient from '../api/axiosConfig';

const AiScreen = () => {
    const [selectedDevice, setSelectedDevice] = useState(DEVICES[0]);
    const [chatQuery, setChatQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChat = async () => {
        if (!chatQuery.trim()) return;
        setIsLoading(true);
        setChatResponse('');
        try {
            const chatUrl = `${selectedDevice.baseUrl}${selectedDevice.endpoint}/chat`;
            const res = await apiClient.post(chatUrl, { query: chatQuery });
            setChatResponse(res.data.ai_response);
        } catch (error) {
            console.error("AI Chat Error:", error);
            setChatResponse('Error: Could not connect to the RhishDesk API.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={globalStyles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
                    <View style={{ paddingTop: 80 }}>
                        <Text style={globalStyles.title}>AI Assistant</Text>
                        <Text style={styles.subtitle}>Talk directly to your devices.</Text>
                    </View>

                    <View>
                        <Text style={styles.selectorLabel}>Select a device to talk to:</Text>
                        <View style={styles.deviceSelector}>
                            {DEVICES.map(device => (
                                <TouchableOpacity
                                    key={device.name}
                                    style={[
                                        styles.deviceButton,
                                        selectedDevice.name === device.name && styles.selectedButton
                                    ]}
                                    onPress={() => setSelectedDevice(device)}
                                >
                                    <Text style={styles.deviceButtonText}>{device.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={globalStyles.card}>
                        <BlurView intensity={40} tint="dark" style={globalStyles.cardContent}>
                            <Text style={[globalStyles.subtitle, {textAlign: 'center'}]}>Gemini Chat</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., is chrome running?"
                                placeholderTextColor={COLORS.textSecondary}
                                value={chatQuery}
                                onChangeText={setChatQuery}
                            />
                            <TouchableOpacity style={styles.button} onPress={handleChat} disabled={isLoading}>
                                <Text style={styles.buttonText}>{isLoading ? 'Thinking...' : 'Ask AI'}</Text>
                            </TouchableOpacity>

                            {isLoading && <ActivityIndicator style={{ marginTop: 20 }} color={COLORS.accentPurple} size="small" />}
                            {chatResponse ? (
                                <View style={styles.responseContainer}>
                                     <Text style={styles.aiResponse}>{chatResponse}</Text>
                                </View>
                            ) : null}
                        </BlurView>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        paddingHorizontal: 20,
        marginTop: -10,
        marginBottom: 20,
    },
    button: {
        backgroundColor: COLORS.accentPurple,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center'
    },
    buttonText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16
    },
    textInput: {
        backgroundColor: COLORS.glass,
        color: COLORS.text,
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        fontSize: 16
    },
    responseContainer: {
        marginTop: 20,
        backgroundColor: COLORS.glass,
        borderRadius: 8,
        padding: 15,
    },
    aiResponse: {
        color: COLORS.text,
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 22,
    },
    selectorLabel: {
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 10,
    },
    deviceSelector: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 20,
        marginHorizontal: 20,
    },
    deviceButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: COLORS.glass,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.glass,
    },
    selectedButton: {
        backgroundColor: COLORS.accentPurple,
        borderColor: COLORS.accentPurple,
    },
    deviceButtonText: {
        color: COLORS.text,
        fontWeight: '600',
    },
});

export default AiScreen;