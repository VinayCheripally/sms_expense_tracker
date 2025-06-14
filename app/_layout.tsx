import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuth } from '@/hooks/useAuth';
import AuthScreen from '@/components/AuthScreen';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Import headless task registration for Android
if (Platform.OS === 'android') {
  require('@/services/smsHeadlessTask');
}

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export default function RootLayout() {
  useFrameworkReady();
  const { user, loading } = useAuth();

  useEffect(() => {
    window.frameworkReady?.();
    
    // Log headless task registration status
    if (Platform.OS === 'android') {
      console.log('📋 Headless JS Task for SMS processing registered in root layout');
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="auto" />
      </>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});