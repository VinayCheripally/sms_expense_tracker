import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Info, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Settings } from 'lucide-react-native';
import { backgroundSmsService } from '@/services/backgroundSmsService';

export default function BackgroundSMSInfo() {
  const [capabilities, setCapabilities] = useState<{
    canReceiveInBackground: boolean;
    limitations: string[];
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    checkCapabilities();
  }, []);

  const checkCapabilities = async () => {
    const result = await backgroundSmsService.checkBackgroundCapabilities();
    setCapabilities(result);
  };

  const showBackendServiceGuide = () => {
    Alert.alert(
      'Backend SMS Service Setup',
      'The backend SMS service uses DeviceEventEmitter for communication:\n\n' +
      '1. Native backend handles SMS reception\n' +
      '2. Backend processes and filters SMS messages\n' +
      '3. DeviceEventEmitter sends events to React Native\n' +
      '4. Frontend processes transaction notifications\n\n' +
      'This approach works even when the app is in background.\n\n' +
      'Make sure your native backend (SmsReceiver.kt) is properly configured.',
      [
        { text: 'Got it', style: 'default' }
      ]
    );
  };

  if (Platform.OS !== 'android' || !capabilities) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Info color="#3B82F6" size={20} />
        <Text style={styles.title}>Backend SMS Service</Text>
      </View>

      <View style={styles.statusContainer}>
        {capabilities.canReceiveInBackground ? (
          <View style={styles.statusRow}>
            <CheckCircle color="#10B981" size={16} />
            <Text style={[styles.statusText, { color: '#10B981' }]}>
              Backend service ready for background processing
            </Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <AlertTriangle color="#F59E0B" size={16} />
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>
              Backend service with limited capabilities
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backend Service Features:</Text>
        <Text style={styles.listItem}>• DeviceEventEmitter communication</Text>
        <Text style={styles.listItem}>• Background SMS processing</Text>
        <Text style={styles.listItem}>• Enhanced pattern matching</Text>
        <Text style={styles.listItem}>• Real-time transaction detection</Text>
      </View>

      {capabilities.recommendations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations:</Text>
          {capabilities.recommendations.map((recommendation, index) => (
            <Text key={index} style={styles.listItem}>• {recommendation}</Text>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={showBackendServiceGuide}>
        <Settings color="#3B82F6" size={16} />
        <Text style={styles.buttonText}>Backend Service Guide</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        💡 Backend service uses native SMS receiver with DeviceEventEmitter for reliable background processing.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  listItem: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    marginBottom: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 8,
  },
  note: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 16,
  },
});