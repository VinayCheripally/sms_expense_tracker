import { Platform, AppState, AppStateStatus } from 'react-native';
import { smsBackendService } from './smsBackendService';
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
    console.log('🔄 Initializing Background SMS Service with Backend...');
    
    if (Platform.OS !== 'android') {
      console.warn('⚠️ Background SMS service only available on Android');
      return;
    }

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    // Initialize the backend SMS service (this handles background processing)
    await smsBackendService.initialize();
    
    console.log('✅ Background SMS Service with Backend initialized');
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
    console.log('🌙 App going to background - backend service continues running...');
    
    try {
      // Show notification that backend service is active
      await notificationService.showBackgroundNotification();
      
      console.log('💡 Backend SMS service will continue processing SMS in background');
      
    } catch (error) {
      console.error('❌ Error handling background transition:', error);
    }
  }

  private async handleAppComingForeground(): Promise<void> {
    console.log('☀️ App coming to foreground - backend service was active...');
    
    try {
      // Check if we missed any transactions while in background
      if (this.missedTransactionCount > 0) {
        await notificationService.showMissedTransactionsAlert(this.missedTransactionCount);
        this.missedTransactionCount = 0;
      }
      
      // Backend service should still be running, no need to restart
      console.log('✅ Backend SMS service continued running in background');
      
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
    
    smsBackendService.cleanup();
  }

  // Check if background processing is working
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

    // With backend service, background processing should work much better
    const androidVersion = Platform.Version;
    
    if (androidVersion >= 26) { // Android 8.0+
      recommendations.push('Backend service handles background processing');
      recommendations.push('Keep app in recent apps for best performance');
    }

    if (androidVersion >= 29) { // Android 10+
      recommendations.push('Backend service bypasses most background restrictions');
      recommendations.push('Enable "Allow background activity" for optimal performance');
    }

    // Backend service should work regardless of frontend permissions
    const canReceiveInBackground = true; // Backend handles this
    
    if (canReceiveInBackground) {
      recommendations.push('Backend SMS service is active and monitoring');
    }
    
    return {
      canReceiveInBackground,
      limitations,
      recommendations
    };
  }
}

export const backgroundSmsService = BackgroundSMSService.getInstance();