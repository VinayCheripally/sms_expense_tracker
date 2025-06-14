import { Platform, AppState, AppStateStatus } from 'react-native';
import { smsService } from './smsService';
import { notificationService } from './notificationService';

export class BackgroundSMSService {
  private static instance: BackgroundSMSService;
  private appStateSubscription: any = null;
  private isAppInBackground = false;
  private missedTransactionCount = 0;

  static getInstance(): BackgroundSMSService {
    if (!BackgroundSMSService.instance) {
      BackgroundSMSService.instance = new BackgroundSMSService();
    }
    return BackgroundSMSService.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing Background SMS Service...');
    
    if (Platform.OS !== 'android') {
      console.warn('⚠️ Background SMS service only available on Android');
      return;
    }

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    // Start SMS listening
    await smsService.startListening();
    
    console.log('✅ Background SMS Service initialized');
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    console.log('📱 App state changed to:', nextAppState);
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.isAppInBackground = true;
      this.handleAppGoingBackground();
    } else if (nextAppState === 'active') {
      this.isAppInBackground = false;
      this.handleAppComingForeground();
    }
  }

  private async handleAppGoingBackground(): Promise<void> {
    console.log('🌙 App going to background - implementing workarounds...');
    
    try {
      // Show persistent notification to keep app "alive"
      await notificationService.showBackgroundNotification();
      
      // Educate user about keeping app in recent apps
      setTimeout(() => {
        notificationService.showKeepAliveReminder();
      }, 5000);
      
    } catch (error) {
      console.error('❌ Error handling background transition:', error);
    }
  }

  private async handleAppComingForeground(): Promise<void> {
    console.log('☀️ App coming to foreground - checking for missed transactions...');
    
    try {
      // Check if we missed any transactions while in background
      if (this.missedTransactionCount > 0) {
        await notificationService.showMissedTransactionsAlert(this.missedTransactionCount);
        this.missedTransactionCount = 0;
      }
      
      // Restart SMS listening to ensure it's active
      await smsService.startListening();
      
    } catch (error) {
      console.error('❌ Error handling foreground transition:', error);
    }
  }

  // Call this when a transaction is detected while app is in background
  incrementMissedTransactions(): void {
    if (this.isAppInBackground) {
      this.missedTransactionCount++;
    }
  }

  cleanup(): void {
    console.log('🧹 Cleaning up Background SMS Service...');
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    smsService.stopListening();
  }

  // Check if background processing is likely to work
  async checkBackgroundCapabilities(): Promise<{
    canReceiveInBackground: boolean;
    limitations: string[];
    recommendations: string[];
  }> {
    const limitations: string[] = [];
    const recommendations: string[] = [];
    
    if (Platform.OS !== 'android') {
      limitations.push('SMS reading only available on Android');
      return { canReceiveInBackground: false, limitations, recommendations };
    }

    // Check Android version (approximate)
    const androidVersion = Platform.Version;
    if (androidVersion >= 26) { // Android 8.0+
      limitations.push('Android 8+ restricts background broadcast receivers');
      recommendations.push('Keep app in recent apps list');
      recommendations.push('Disable battery optimization for this app');
    }

    if (androidVersion >= 29) { // Android 10+
      limitations.push('Android 10+ has stricter background activity limits');
      recommendations.push('Enable "Allow background activity" in app settings');
    }

    // Check if SMS permissions are granted
    const hasPermissions = await smsService.getPermissionStatus();
    if (!hasPermissions) {
      limitations.push('SMS permissions not granted');
      recommendations.push('Grant SMS reading permissions');
    }

    const canReceiveInBackground = hasPermissions && androidVersion < 26;
    
    return {
      canReceiveInBackground,
      limitations,
      recommendations
    };
  }
}

export const backgroundSmsService = BackgroundSMSService.getInstance();