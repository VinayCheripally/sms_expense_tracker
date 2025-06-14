import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';
import { notificationService } from '@/services/notificationService';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export default function NotificationPermissionModal({ 
  visible, 
  onClose, 
  onPermissionGranted 
}: NotificationPermissionModalProps) {
  const handleRequestPermission = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      
      if (granted) {
        onPermissionGranted();
        onClose();
        
        // Show a test notification
        setTimeout(() => {
          notificationService.showWelcomeNotification();
        }, 1000);
        
        Alert.alert(
          'Success!', 
          'Notifications enabled. You\'ll now receive alerts for new transactions.'
        );
      } else {
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in Settings > Notifications.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handleSkip = () => {
    onClose();
    Alert.alert(
      'Notifications Skipped',
      'You can enable notifications later in the Settings tab.'
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color="#6B7280" size={24} />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Bell color="#3B82F6" size={48} />
            </View>

            <Text style={styles.title}>Enable Notifications</Text>
            <Text style={styles.description}>
              Get instant alerts when new transactions are detected from your SMS messages. 
              This helps you categorize expenses quickly and stay on top of your spending.
            </Text>

            <View style={styles.benefits}>
              <View style={styles.benefit}>
                <Check color="#10B981" size={20} />
                <Text style={styles.benefitText}>Real-time transaction alerts</Text>
              </View>
              <View style={styles.benefit}>
                <Check color="#10B981" size={20} />
                <Text style={styles.benefitText}>Quick expense categorization</Text>
              </View>
              <View style={styles.benefit}>
                <Check color="#10B981" size={20} />
                <Text style={styles.benefitText}>Monthly spending reminders</Text>
              </View>
            </View>

            <View style={styles.buttons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleRequestPermission}
              >
                <Text style={styles.primaryButtonText}>Enable Notifications</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSkip}
              >
                <Text style={styles.secondaryButtonText}>Maybe Later</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefits: {
    width: '100%',
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
});