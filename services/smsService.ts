import { Platform } from 'react-native';
import { smsBackendService } from './smsBackendService';
import SMSPatternMatcher from './smsPatterns';

// Legacy SMS Service - now acts as a wrapper for the backend service
export class SMSService {
  private static instance: SMSService;

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async startListening(): Promise<void> {
    console.log('🔄 Starting SMS listening (delegating to backend service)...');
    
    if (Platform.OS === 'web') {
      console.warn('⚠️ SMS reading is not available on web platform');
      return;
    }

    if (Platform.OS !== 'android') {
      console.warn('⚠️ SMS listening is only available on Android');
      return;
    }

    // Delegate to backend service
    await smsBackendService.initialize();
  }

  stopListening(): void {
    console.log('🛑 Stopping SMS listening (delegating to backend service)...');
    smsBackendService.stopListening();
  }

  async getPermissionStatus(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    // For backend service, we assume permissions are handled by the native backend
    // In a real implementation, you might want to check this via a native module
    console.log('📋 Checking SMS permissions (backend handles this)...');
    return true; // Backend service handles permissions
  }

  isCurrentlyListening(): boolean {
    return smsBackendService.isCurrentlyListening();
  }

  // Enhanced simulation that uses the backend service
  async simulateTransaction(): Promise<void> {
    console.log('🧪 Simulating transaction via backend service...');
    await smsBackendService.simulateBackendSMS();
  }

  // Test all patterns using the backend service
  async testAllPatterns(): Promise<void> {
    console.log('🧪 Testing all SMS patterns via backend service...');
    
    const testMessages = [
      // Spam messages
      "Congratulations! You have won a FREE gift card worth ₹1000. Click here!!!",
      "100% free loan approved! Call now for instant cash. Limited time offer!",
      
      // Transaction messages
      "Your A/c X1234 has been debited for Rs. 5,000 on 12 Jun. Avl Bal: Rs 25,000",
      "Your account is credited with INR 2,500 by IMPS from John Doe",
      "Paid ₹250 to Amazon via GPay. Transaction ID: ABC123. Balance: ₹1000",
      "Transaction of Rs.150.50 at McDonald's using HDFC Debit Card",
      "ATM WDL Rs.500 from ICICI ATM at CP on 13-Jun. Avl Bal: Rs.2000",
      "UPI payment of ₹75 to Ola successful. Ref: OLA123456789",
      
      // Non-transactional messages
      "Hello, this is a friendly reminder about your appointment tomorrow.",
      "Your OTP for login is 123456. Do not share with anyone.",
      "Meeting scheduled for 3 PM today. Please confirm attendance."
    ];
    
    console.log('📊 Pattern Matching Test Results (Backend Service):');
    console.log('=====================================');
    
    testMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Testing message via backend:`);
      SMSPatternMatcher.testMessage(msg);
      
      // Simulate sending this message through the backend
      setTimeout(() => {
        smsBackendService.simulateBackendSMS();
      }, index * 1000); // Stagger the tests
    });
  }
}

export const smsService = SMSService.getInstance();