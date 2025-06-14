import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { User, Bell, Shield, Smartphone, LogOut, ExternalLink, TestTube, CircleCheck as CheckCircle, Circle as XCircle, Zap, Wrench } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { smsService } from '@/services/smsService';
import { smsBackendService } from '@/services/smsBackendService';
import { notificationService } from '@/services/notificationService';
import { backgroundSmsService } from '@/services/backgroundSmsService';
import BackgroundSMSInfo from '@/components/BackgroundSMSInfo';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [backendServiceStatus, setBackendServiceStatus] = useState(false);

  useEffect(() => {
    checkPermissionStatuses();
    initializeBackgroundService();
  }, []);

  const initializeBackgroundService = async () => {
    if (Platform.OS === 'android') {
      try {
        await backgroundSmsService.initialize();
      } catch (error) {
        console.error('Failed to initialize background SMS service:', error);
      }
    }
  };

  const checkPermissionStatuses = async () => {
    // Check notification status
    const notifStatus = await notificationService.checkPermissionStatus();
    setNotificationStatus(notifStatus);

    // Check backend service status
    const backendStatus = smsBackendService.isCurrentlyListening();
    setBackendServiceStatus(backendStatus);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Stop backend service before signing out
            smsBackendService.cleanup();
            backgroundSmsService.cleanup();
            
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleBackendSMSService = async () => {
    try {
      if (!backendServiceStatus) {
        await smsBackendService.initialize();
        setBackendServiceStatus(true);
        Alert.alert(
          'Success', 
          'Backend SMS service started! The service will now monitor SMS messages in the background via DeviceEventEmitter.'
        );
      } else {
        Alert.alert(
          'Service Active',
          'Backend SMS service is already running and monitoring messages.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Service Error',
        'Failed to start backend SMS service. Make sure the native backend is properly configured.'
      );
    }
  };

  const handleNotificationPermissions = async () => {
    try {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        setNotificationStatus('granted');
        Alert.alert('Success', 'Notification permissions granted');
        
        // Show a test notification
        setTimeout(() => {
          notificationService.testNotification();
        }, 1000);
      } else {
        setNotificationStatus('denied');
        Alert.alert(
          'Permission Denied',
          'You can enable notifications in your device settings.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to request notification permissions');
    }
  };

  const handleTestNotification = async () => {
    try {
      if (notificationStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications first to test them.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable', onPress: handleNotificationPermissions }
          ]
        );
        return;
      }

      await notificationService.testNotification();
      Alert.alert('Test Sent', 'Check your notifications!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleTestBackendTransaction = async () => {
    try {
      // Check notification permissions first
      const permissionStatus = await notificationService.checkPermissionStatus();
      
      if (permissionStatus !== 'granted') {
        Alert.alert(
          'Notification Permission Required',
          'To see transaction notifications, please enable notifications first.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable Notifications', onPress: handleNotificationPermissions }
          ]
        );
        return;
      }

      await smsBackendService.simulateBackendSMS();
      Alert.alert(
        'Backend Test Transaction Sent', 
        'A simulated transaction has been processed via the backend service. Check your notifications and expenses list!'
      );
    } catch (error) {
      console.error('Backend test transaction error:', error);
      Alert.alert('Error', 'Failed to simulate backend transaction');
    }
  };

  const handleTestAllPatterns = async () => {
    try {
      Alert.alert(
        'Pattern Testing',
        'This will test all SMS patterns via the backend service and log results to console.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Run Tests', 
            onPress: async () => {
              await smsService.testAllPatterns();
              Alert.alert('Tests Complete', 'Check the console for detailed results!');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to run pattern tests');
    }
  };

  const handleBackgroundServiceTest = async () => {
    try {
      const capabilities = await backgroundSmsService.checkBackgroundCapabilities();
      
      Alert.alert(
        'Backend Service Status',
        `Backend SMS service: ${backendServiceStatus ? 'Active' : 'Inactive'}\n\n` +
        `Can receive in background: ${capabilities.canReceiveInBackground ? 'Yes' : 'Limited'}\n\n` +
        `Limitations: ${capabilities.limitations.length}\n` +
        `Recommendations: ${capabilities.recommendations.length}\n\n` +
        'Check console for detailed information.'
      );
      
      console.log('Backend SMS Service Capabilities:', capabilities);
    } catch (error) {
      Alert.alert('Error', 'Failed to check backend service capabilities');
    }
  };

  const getNotificationStatusText = () => {
    switch (notificationStatus) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Disabled';
      default:
        return 'Not set';
    }
  };

  const getNotificationStatusColor = () => {
    switch (notificationStatus) {
      case 'granted':
        return '#10B981';
      case 'denied':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getBackendServiceStatusText = () => {
    return backendServiceStatus ? 'Active' : 'Inactive';
  };

  const getBackendServiceStatusColor = () => {
    return backendServiceStatus ? '#10B981' : '#EF4444';
  };

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          title: 'Profile',
          subtitle: user?.email,
          onPress: () => Alert.alert('Profile', 'Profile settings coming soon!'),
        },
      ],
    },
    {
      title: 'Backend Services',
      items: [
        {
          icon: Bell,
          title: 'Notifications',
          subtitle: getNotificationStatusText(),
          onPress: handleNotificationPermissions,
          statusColor: getNotificationStatusColor(),
          statusIcon: notificationStatus === 'granted' ? CheckCircle : XCircle,
        },
        {
          icon: Smartphone,
          title: 'Backend SMS Service',
          subtitle: getBackendServiceStatusText(),
          onPress: handleBackendSMSService,
          statusColor: getBackendServiceStatusColor(),
          statusIcon: backendServiceStatus ? CheckCircle : XCircle,
        },
      ],
    },
    {
      title: 'Testing & Debugging',
      items: [
        {
          icon: TestTube,
          title: 'Test Notification',
          subtitle: 'Send a test notification',
          onPress: handleTestNotification,
        },
        {
          icon: TestTube,
          title: 'Test Backend Transaction',
          subtitle: 'Simulate backend SMS transaction detection',
          onPress: handleTestBackendTransaction,
        },
        {
          icon: Zap,
          title: 'Test All Patterns',
          subtitle: 'Test spam & transaction pattern matching',
          onPress: handleTestAllPatterns,
        },
        {
          icon: Wrench,
          title: 'Backend Service Test',
          subtitle: 'Check backend SMS service capabilities',
          onPress: handleBackgroundServiceTest,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          title: 'Privacy & Security',
          subtitle: 'Manage your data and privacy',
          onPress: () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: ExternalLink,
          title: 'Help & Support',
          subtitle: 'Get help and contact support',
          onPress: () => Alert.alert('Support', 'Support options coming soon!'),
        },
      ],
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Backend SMS Info Component */}
      <BackgroundSMSInfo />

      {/* Enhanced Backend Service Status Info */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Backend SMS Service Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Service Status:</Text>
          <Text style={[styles.statusValue, { color: getBackendServiceStatusColor() }]}>
            {getBackendServiceStatusText()}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Communication:</Text>
          <Text style={[styles.statusValue, { color: '#10B981' }]}>
            DeviceEventEmitter
          </Text>
        </View>
        <Text style={styles.statusNote}>
          Backend service uses DeviceEventEmitter to communicate SMS data from native backend to React Native frontend.
          This approach works even when the app is in background.
        </Text>
      </View>

      {/* Settings Groups */}
      {settingsGroups.map((group, groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupContainer}>
            {group.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              const StatusIconComponent = item.statusIcon;
              return (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    item.disabled && styles.settingItemDisabled,
                    itemIndex === group.items.length - 1 && styles.settingItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.disabled}
                >
                  <View style={styles.settingIcon}>
                    <IconComponent 
                      color={item.disabled ? '#9CA3AF' : '#6B7280'} 
                      size={20} 
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[
                      styles.settingTitle,
                      item.disabled && styles.settingTitleDisabled
                    ]}>
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <View style={styles.subtitleContainer}>
                        <Text style={[
                          styles.settingSubtitle,
                          item.disabled && styles.settingSubtitleDisabled,
                          item.statusColor && { color: item.statusColor }
                        ]}>
                          {item.subtitle}
                        </Text>
                        {StatusIconComponent && (
                          <StatusIconComponent 
                            color={item.statusColor} 
                            size={16} 
                            style={styles.statusIcon}
                          />
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.arrow,
                    item.disabled && styles.arrowDisabled
                  ]}>
                    ›
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Sign Out */}
      <View style={styles.signOutContainer}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut color="#EF4444" size={20} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>SmartExpense v2.0.0</Text>
        <Text style={styles.appInfoText}>Built with Expo & Supabase</Text>
        <Text style={styles.appInfoText}>Backend SMS Service with DeviceEventEmitter</Text>
        <Text style={styles.appInfoText}>Background Processing: {backendServiceStatus ? 'Active' : 'Inactive'}</Text>
        {notificationService.getExpoPushToken() && (
          <Text style={styles.tokenText}>
            Push Token: {notificationService.getExpoPushToken()?.slice(0, 20)}...
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  group: {
    marginTop: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  groupContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingTitleDisabled: {
    color: '#9CA3AF',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingSubtitleDisabled: {
    color: '#9CA3AF',
  },
  statusIcon: {
    marginLeft: 8,
  },
  arrow: {
    fontSize: 18,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  arrowDisabled: {
    color: '#D1D5DB',
  },
  signOutContainer: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 8,
    fontFamily: 'monospace',
  },
});