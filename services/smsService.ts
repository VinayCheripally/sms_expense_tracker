import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ExpenseInsert } from '@/types/database';
import { notificationService } from './notificationService';
import SMSPatternMatcher from './smsPatterns';

// Import SMS listener for Android
let SmsListener: any = null;
if (Platform.OS === 'android') {
  try {
    SmsListener = require('react-native-android-sms-listener').default;
  } catch (error) {
    console.warn('SMS Listener not available:', error);
  }
}

interface TransactionData {
  amount: number;
  merchant: string;
  timestamp: Date;
  originalText: string;
  type: 'debit' | 'credit';
}

export class SMSService {
  private static instance: SMSService;
  private isListening = false;
  private smsSubscription: any = null;

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService();
    }
    return SMSService.instance;
  }

  async startListening(): Promise<void> {
    console.log('Starting SMS listening...');
    
    if (Platform.OS === 'web') {
      console.warn('SMS reading is not available on web platform');
      return;
    }

    if (Platform.OS !== 'android') {
      console.warn('SMS listening is only available on Android');
      return;
    }

    if (this.isListening) {
      console.log('SMS listening already active');
      return;
    }

    if (!SmsListener) {
      console.error('SMS Listener module not available');
      throw new Error('SMS Listener module not found');
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('SMS permission denied');
      }

      // Start listening for SMS messages
      this.smsSubscription = SmsListener.addListener((message: any) => {
        console.log('📱 New SMS received from:', message.originatingAddress);
        console.log('📄 SMS content preview:', message.body?.substring(0, 100) + '...');
        this.handleIncomingSMS(message);
      });

      this.isListening = true;
      console.log('✅ SMS listening started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start SMS listening:', error);
      throw error;
    }
  }

  stopListening(): void {
    console.log('🛑 Stopping SMS listening...');
    
    if (this.smsSubscription) {
      this.smsSubscription.remove();
      this.smsSubscription = null;
    }
    
    this.isListening = false;
    console.log('✅ SMS listening stopped');
  }

  private async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.warn('SMS permissions only available on Android');
      return false;
    }
    
    try {
      console.log('🔐 Requesting SMS permissions...');
      
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        PermissionsAndroid.PERMISSIONS.READ_SMS,
      ]);

      const receiveSmsGranted = granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED;
      const readSmsGranted = granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED;

      const allPermissionsGranted = receiveSmsGranted && readSmsGranted;
      
      console.log('📋 SMS permissions result:', {
        receiveSms: receiveSmsGranted,
        readSms: readSmsGranted,
        allGranted: allPermissionsGranted
      });

      return allPermissionsGranted;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  private async handleIncomingSMS(message: any): Promise<void> {
    try {
      console.log('🔍 Processing incoming SMS...');
      console.log('📞 From:', message.originatingAddress);
      
      // Use the enhanced pattern matcher
      const analysisResult = SMSPatternMatcher.processMessage(message.body);
      
      console.log('📊 SMS Analysis Result:', analysisResult);
      
      if (analysisResult.status === 'spam') {
        console.log('🚫 SMS identified as spam - ignoring');
        return;
      }
      
      if (analysisResult.status === 'transactional' && analysisResult.amount && analysisResult.type) {
        console.log('💳 Transaction SMS detected!');
        
        // Extract merchant using enhanced pattern matching
        const merchant = SMSPatternMatcher.extractMerchant(message.body);
        
        const transactionData: TransactionData = {
          amount: parseFloat(analysisResult.amount),
          merchant: merchant,
          timestamp: new Date(),
          originalText: message.body,
          type: analysisResult.type
        };
        
        console.log('💰 Transaction Data:', {
          amount: transactionData.amount,
          merchant: transactionData.merchant,
          type: transactionData.type
        });
        
        // Only process debit transactions for expense tracking
        if (transactionData.type === 'debit') {
          await this.processTransaction(transactionData);
        } else {
          console.log('💚 Credit transaction detected but not processed for expense tracking');
        }
      } else {
        console.log('📝 Non-transactional SMS - ignoring');
      }
    } catch (error) {
      console.error('❌ Error handling incoming SMS:', error);
    }
  }

  // Legacy method for backward compatibility - now uses enhanced pattern matching
  extractTransactionData(smsText: string): TransactionData | null {
    const result = SMSPatternMatcher.processMessage(smsText);
    
    if (result.status === 'transactional' && result.amount && result.type === 'debit') {
      const merchant = SMSPatternMatcher.extractMerchant(smsText);
      
      return {
        amount: parseFloat(result.amount),
        merchant: merchant,
        timestamp: new Date(),
        originalText: smsText,
        type: 'debit'
      };
    }
    
    return null;
  }

  private cleanMerchantName(merchant: string): string {
    return merchant
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim()
      .slice(0, 50); // Limit length
  }

  async processTransaction(transactionData: TransactionData): Promise<void> {
    try {
      console.log('⚡ Processing transaction:', transactionData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user found');
        return;
      }

      // Show notification first
      console.log('🔔 Showing notification...');
      await notificationService.showTransactionNotification(
        transactionData.amount,
        transactionData.merchant
      );

      // Store in database
      console.log('💾 Storing transaction in database...');
      await this.storePendingTransaction(user.id, transactionData);
      
      console.log('✅ Transaction processed successfully');
    } catch (error) {
      console.error('❌ Failed to process transaction:', error);
    }
  }

  private async storePendingTransaction(userId: string, data: TransactionData): Promise<void> {
    const expense: ExpenseInsert = {
      user_id: userId,
      amount: data.amount,
      merchant: data.merchant,
      category: 'Other', // Default category
      timestamp: data.timestamp.toISOString(),
      sms_text: data.originalText,
    };

    const { error } = await supabase
      .from('expenses')
      .insert(expense);

    if (error) {
      console.error('❌ Failed to store transaction:', error);
      throw error;
    }
    
    console.log('✅ Transaction stored in database');
  }

  // Enhanced simulation with multiple test cases
  async simulateTransaction(): Promise<void> {
    console.log('🧪 Starting enhanced transaction simulation...');
    
    // Check notification permissions first
    const permissionStatus = await notificationService.checkPermissionStatus();
    console.log('🔔 Notification permission status:', permissionStatus);
    
    if (permissionStatus !== 'granted') {
      console.warn('⚠️ Notification permissions not granted');
    }
    
    // Test different SMS patterns
    const testMessages = [
      "Your A/c X1234 has been debited for Rs. 250.00 at Amazon on 13-Jun-24. Avl Bal: Rs 25,000.00",
      "Paid ₹150 to Swiggy via UPI. Transaction ID: ABC123456789. Balance: ₹5000",
      "Transaction of Rs.500 at Big Bazaar using your HDFC Bank Debit Card ending 1234",
      "Your account is debited by INR 75.50 for Uber ride. Ref No: UBR123456",
      "ATM WDL Rs.2000 from SBI ATM at MG Road on 13-Jun-24. Avl Bal: Rs.15000"
    ];
    
    // Pick a random test message
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    console.log('📱 Simulating SMS:', randomMessage);
    
    // Test the pattern matching
    console.log('🔍 Testing pattern matching...');
    SMSPatternMatcher.testMessage(randomMessage);
    
    // Process the transaction
    const transactionData = this.extractTransactionData(randomMessage);
    console.log('💰 Extracted transaction data:', transactionData);
    
    if (transactionData) {
      await this.processTransaction(transactionData);
    } else {
      console.error('❌ Failed to extract transaction data from test SMS');
    }
  }

  // Test all patterns for debugging
  async testAllPatterns(): Promise<void> {
    console.log('🧪 Testing all SMS patterns...');
    
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
    
    console.log('📊 Pattern Matching Test Results:');
    console.log('=====================================');
    
    testMessages.forEach((msg, index) => {
      console.log(`\n${index + 1}. Testing message:`);
      SMSPatternMatcher.testMessage(msg);
    });
  }

  // Check if SMS listening is currently active
  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Get SMS permission status
  async getPermissionStatus(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    
    try {
      const receiveSmsStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECEIVE_SMS);
      const readSmsStatus = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      
      return receiveSmsStatus && readSmsStatus;
    } catch (error) {
      console.error('❌ Error checking SMS permissions:', error);
      return false;
    }
  }
}

export const smsService = SMSService.getInstance();