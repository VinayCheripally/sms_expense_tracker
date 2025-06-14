import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private isInitialized = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('Initializing notification service...');

    // Configure notification behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Request permissions and get push token
    await this.registerForPushNotificationsAsync();

    // Set up notification listeners
    this.setupNotificationListeners();

    this.isInitialized = true;
    console.log('Notification service initialized');
  }

  private async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      // Create a high-priority channel for background notifications
      await Notifications.setNotificationChannelAsync('background', {
        name: 'Background Service',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        lightColor: '#3B82F6',
        showBadge: false,
      });
    }

    if (Device.isDevice || Platform.OS === 'web') {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return null;
      }

      try {
        if (Platform.OS !== 'web') {
          const projectId = Constants.expoConfig?.extra?.eas?.projectId;

          if (!projectId) {
            console.error('EAS project ID not found in app.json configuration');
            return null;
          }

          token = (
            await Notifications.getExpoPushTokenAsync({
              projectId,
            })
          ).data;
        }

        this.expoPushToken = token;
        console.log('Expo Push Token:', token);
      } catch (error) {
        console.error('Error getting push token:', error);
      }
    } else {
      console.warn('Must use physical device for Push Notifications');
    }

    return token;
  }

  private setupNotificationListeners(): void {
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;

      if (data.type === 'transaction') {
        console.log('Transaction notification tapped:', data);
      }
    });
  }

  async checkPermissionStatus(): Promise<
    'granted' | 'denied' | 'undetermined'
  > {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  async showTransactionNotification(
    amount: number,
    merchant: string
  ): Promise<void> {
    try {
      console.log('Attempting to show transaction notification...');

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💳 New Transaction Detected',
          body: `₹${amount.toFixed(
            2
          )} spent at ${merchant}. Tap to categorize.`,
          data: {
            type: 'transaction',
            amount,
            merchant,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      console.log(
        'Transaction notification scheduled with ID:',
        notificationId
      );
    } catch (error) {
      console.error('Failed to show transaction notification:', error);
    }
  }

  // New: Background service notification
  async showBackgroundNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📱 SmartExpense Active',
          body: 'Monitoring SMS for transactions in background',
          data: { type: 'background_service' },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show background notification:', error);
    }
  }

  // New: Keep alive reminder
  async showKeepAliveReminder(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💡 Keep App Active',
          body: 'For best SMS detection, keep SmartExpense in your recent apps and disable battery optimization.',
          data: { type: 'keep_alive_reminder' },
          sound: false,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show keep alive reminder:', error);
    }
  }

  // New: Missed transactions alert
  async showMissedTransactionsAlert(count: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Possible Missed Transactions',
          body: `App was in background. Check if any of your recent ${count} transactions need categorization.`,
          data: { type: 'missed_transactions', count },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show missed transactions alert:', error);
    }
  }

  async showCategoryReminder(pendingCount: number): Promise<void> {
    if (pendingCount === 0) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📊 Pending Categorization',
          body: `You have ${pendingCount} transactions waiting to be categorized.`,
          data: { type: 'reminder', pendingCount },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show reminder notification:', error);
    }
  }

  async showWelcomeNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Welcome to SmartExpense!',
          body: "Your expense tracking is now active. We'll notify you of new transactions.",
          data: { type: 'welcome' },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to show welcome notification:', error);
    }
  }

  async testNotification(): Promise<void> {
    try {
      console.log('Sending test notification...');

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification to verify everything is working!',
          data: { type: 'test' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });

      console.log('Test notification scheduled with ID:', notificationId);
    } catch (error) {
      console.error('Failed to show test notification:', error);
    }
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = NotificationService.getInstance();
