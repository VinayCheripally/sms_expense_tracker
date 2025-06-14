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
import { notificationService } from '@/services/notificationService';
import { backgroundSmsService } from '@/services/backgroundSmsService';
import BackgroundSMSInfo from '@/components/BackgroundSMSInfo';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [smsPermissionStatus, setSmsPermissionStatus] = useState(false);
  const [smsListeningStatus, setSmsListeningStatus] = useState(false);

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

    // Check SMS permissions and listening status
    if (Platform.OS === 'android') {
      const smsPermissions = await smsService.getPermissionStatus();
      setSmsPermissionStatus(smsPermissions);
      setSmsListeningStatus(smsService.isCurrentlyListening());
    }
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
            // Stop SMS listening and background service before signing out
            smsService.stopListening();
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

  const handleSMSPermissions = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'SMS Permissions',
        'SMS reading is not available on web. This feature requires a native Android app.'
      );
      return;
    }

    if (Platform.OS !== 'android') {
      Alert.alert(
        'SMS Permissions',
        'SMS reading is only available on Android devices.'
      );
      return;
    }

    try {
      await smsService.startListening();
      
      // Refresh status
      await checkPermissionStatuses();
      
      Alert.alert(
        'Success', 
        'SMS permissions granted and listening started! The app will now automatically detect transaction SMS messages.\n\nNote: Background detection may be limited on newer Android versions.'
      );
    } catch (error) {
      Alert.alert(
        'Permission Required',
        'Please grant SMS reading permissions to automatically detect transactions. You can also enable this in your device settings.'
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

  const handleTestTransaction = async () => {
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

      await smsService.simulateTransaction();
      Alert.alert(
        'Test Transaction Sent', 
        'A simulated transaction has been processed. Check your notifications and expenses list!'
      );
    } catch (error) {
      console.error('Test transaction error:', error);
      Alert.alert('Error', 'Failed to simulate transaction');
    }
  };

  const handleTestAllPatterns = async () => {
    try {
      Alert.alert(
        'Pattern Testing',
        'This will test all SMS patterns and log results to console. Check the developer console for detailed output.',
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
        'Background Service Status',
        `Can receive in background: ${capabilities.canReceiveInBackground ? 'Yes' : 'Limited'}\n\n` +
        `Limitations: ${capabilities.limitations.length}\n` +
        `Recommendations: ${capabilities.recommendations.length}\n\n` +
        'Check console for detailed information.'
      );
      
      console.log('Background SMS Capabilities:', capabilities);
    } catch (error) {
      Alert.alert('Error', 'Failed to check background capabilities');
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

  const getSMSStatusText = () => {
    if (Platform.OS !== 'android') return 'Not available';
    if (!smsPermissionStatus) return 'Permission needed';
    if (smsListeningStatus) return 'Active';
    return 'Inactive';
  };

  const getSMSStatusColor = () => {
    if (Platform.OS !== 'android') return '#9CA3AF';
    if (!smsPermissionStatus) return '#F59E0B';
    if (smsListeningStatus) return '#10B981';
    return '#EF4444';
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
      title: 'Permissions',
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
          title: 'SMS Access',
          subtitle: getSMSStatusText(),
          onPress: handleSMSPermissions,
          disabled: Platform.OS !== 'android',
          statusColor: getSMSStatusColor(),
          statusIcon: (Platform.OS === 'android' && smsPermissionStatus && smsListeningStatus) ? CheckCircle : XCircle,
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
          title: 'Test Transaction',
          subtitle: 'Simulate SMS transaction detection',
          onPress: handleTestTransaction,
        },
        {
          icon: Zap,
          title: 'Test All Patterns',
          subtitle: 'Test spam & transaction pattern matching',
          onPress: handleTestAllPatterns,
        },
        {
          icon: Wrench,
          title: 'Background Service Test',
          subtitle: 'Check background SMS capabilities',
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

      {/* Background SMS Info Component */}
      <BackgroundSMSInfo />

      {/* Enhanced SMS Status Info */}
      {Platform.OS === 'android' && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>SMS Detection Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Permissions:</Text>
            <Text style={[styles.statusValue, { color: getSMSStatusColor() }]}>
              {smsPermissionStatus ? 'Granted' : 'Not Granted'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Listening:</Text>
            <Text style={[styles.statusValue, { color: getSMSStatusColor() }]}>
              {smsListeningStatus ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <Text style={styles.statusNote}>
            Enhanced pattern matching now detects spam, transactions, and extracts merchant names automatically.
            Background detection may be limited on Android 8+.
          </Text>
        </View>
      )}

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
        <Text style={styles.appInfoText}>SmartExpense v1.0.0</Text>
        <Text style={styles.appInfoText}>Built with Expo & Supabase</Text>
        <Text style={styles.appInfoText}>Enhanced SMS Pattern Matching v2.0</Text>
        <Text style={styles.appInfoText}>Background Service v1.0</Text>
        {Platform.OS === 'android' && (
          <Text style={styles.appInfoText}>SMS Detection: {smsListeningStatus ? 'Active' : 'Inactive'}</Text>
        )}
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