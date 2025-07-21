import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, globalStyles } from '../constants/styles';
import apiClient from '../api/axiosConfig';

const AiScreen = () => {
    const [chatQuery, setChatQuery] = useState('');
    const [chatResponse, setChatResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChat = async () => {
        if (!chatQuery.trim()) return;
        setIsLoading(true);
        setChatResponse(''); // Clear previous response
        try {
            // The endpoint path is now more specific for clarity
            const res = await apiClient.post('/desktop/chat', { query: chatQuery });
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

                            {/* Response Area */}
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
        marginBottom: 30,
    },
    button: { backgroundColor: COLORS.accentPurple, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: COLORS.text, fontWeight: 'bold', fontSize: 16 },
    textInput: { backgroundColor: COLORS.glass, color: COLORS.text, borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16 },
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
});

export default AiScreen;