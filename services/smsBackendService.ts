import { DeviceEventEmitter, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ExpenseInsert } from '@/types/database';
import { notificationService } from './notificationService';
import SMSPatternMatcher from './smsPatterns';

interface TransactionData {
  amount: number;
  merchant: string;
  timestamp: Date;
  originalText: string;
  type: 'debit' | 'credit';
  sender?: string;
  processedInBackground?: boolean;
}

export class SMSBackendService {
  private static instance: SMSBackendService;
  private isListening = false;
  private eventSubscription: any = null;
  private headlessEventSubscription: any = null;

  static getInstance(): SMSBackendService {
    if (!SMSBackendService.instance) {
      SMSBackendService.instance = new SMSBackendService();
    }
    return SMSBackendService.instance;
  }

  async initialize(): Promise<void> {
    console.log('🔄 Initializing Backend SMS Service with Headless JS support...');
    
    if (Platform.OS !== 'android') {
      console.warn('⚠️ Backend SMS service only available on Android');
      return;
    }

    // Register the headless task
    this.registerHeadlessTask();

    // Start listening for SMS events from native backend
    this.startListening();
    
    console.log('✅ Backend SMS Service with Headless JS initialized');
  }

  private registerHeadlessTask(): void {
    try {
      // Import and register the headless task
      require('./smsHeadlessTask');
      console.log('📋 Headless JS Task registered successfully');
    } catch (error) {
      console.error('❌ Failed to register headless task:', error);
    }
  }

  private startListening(): void {
    if (this.isListening) {
      console.log('📱 SMS backend listener already active');
      return;
    }

    console.log('🎧 Starting DeviceEventEmitter listeners for SMS...');
    
    // Listen for regular SMS events from the native backend
    this.eventSubscription = DeviceEventEmitter.addListener(
      'onSmsReceived',
      this.handleSMSFromBackend.bind(this)
    );

    // Listen for headless task events (background processed transactions)
    this.headlessEventSubscription = DeviceEventEmitter.addListener(
      'onHeadlessTransactionDetected',
      this.handleHeadlessTransaction.bind(this)
    );

    this.isListening = true;
    console.log('✅ DeviceEventEmitter SMS listeners started (regular + headless)');
  }

  private async handleSMSFromBackend(smsData: string): Promise<void> {
    try {
      console.log('📨 Received SMS from backend:', smsData.substring(0, 100) + '...');
      
      // Process the SMS using our pattern matcher
      const analysisResult = SMSPatternMatcher.processMessage(smsData);
      
      console.log('🔍 SMS Analysis Result:', analysisResult);
      
      if (analysisResult.status === 'spam') {
        console.log('🚫 SMS identified as spam - ignoring');
        return;
      }
      
      if (analysisResult.status === 'transactional' && analysisResult.amount && analysisResult.type) {
        console.log('💳 Transaction SMS detected from backend!');
        
        // Extract merchant using enhanced pattern matching
        const merchant = SMSPatternMatcher.extractMerchant(smsData);
        
        const transactionData: TransactionData = {
          amount: parseFloat(analysisResult.amount),
          merchant: merchant,
          timestamp: new Date(),
          originalText: smsData,
          type: analysisResult.type,
          processedInBackground: false
        };
        
        console.log('💰 Transaction Data from Backend:', {
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
        console.log('📝 Non-transactional SMS from backend - ignoring');
      }
    } catch (error) {
      console.error('❌ Error handling SMS from backend:', error);
    }
  }

  private async handleHeadlessTransaction(transactionData: TransactionData): Promise<void> {
    try {
      console.log('🚀 Received transaction from Headless JS Task:', transactionData);
      
      // Process the transaction that was detected in background
      await this.processTransaction(transactionData);
      
      // Show a special notification for background-detected transactions
      await notificationService.showTransactionNotification(
        transactionData.amount,
        `${transactionData.merchant} (Background detected)`
      );
      
      console.log('✅ Headless transaction processed successfully');
      
    } catch (error) {
      console.error('❌ Error handling headless transaction:', error);
    }
  }

  private async processTransaction(transactionData: TransactionData): Promise<void> {
    try {
      console.log('⚡ Processing transaction:', transactionData);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user found');
        return;
      }

      // Show notification (works even in background)
      if (!transactionData.processedInBackground) {
        console.log('🔔 Showing notification...');
        await notificationService.showTransactionNotification(
          transactionData.amount,
          transactionData.merchant
        );
      }

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

  stopListening(): void {
    console.log('🛑 Stopping backend SMS listening...');
    
    if (this.eventSubscription) {
      this.eventSubscription.remove();
      this.eventSubscription = null;
    }

    if (this.headlessEventSubscription) {
      this.headlessEventSubscription.remove();
      this.headlessEventSubscription = null;
    }
    
    this.isListening = false;
    console.log('✅ Backend SMS listening stopped');
  }

  isCurrentlyListening(): boolean {
    return this.isListening;
  }

  // Test method to simulate backend SMS
  async simulateBackendSMS(): Promise<void> {
    console.log('🧪 Simulating backend SMS with Headless JS support...');
    
    const testMessages = [
      "Your A/c X1234 has been debited for Rs. 250.00 at Amazon on 13-Jun-24. Avl Bal: Rs 25,000.00",
      "Paid ₹150 to Swiggy via UPI. Transaction ID: ABC123456789. Balance: ₹5000",
      "Transaction of Rs.500 at Big Bazaar using your HDFC Bank Debit Card ending 1234",
      "ATM WDL Rs.2000 from SBI ATM at MG Road on 13-Jun-24. Avl Bal: Rs.15000"
    ];
    
    const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
    console.log('📱 Simulating backend SMS:', randomMessage);
    
    // Simulate both regular and headless processing
    DeviceEventEmitter.emit('onSmsReceived', randomMessage);
    
    // Also simulate a headless-detected transaction
    setTimeout(() => {
      const transactionData = {
        amount: 299.99,
        merchant: 'Test Merchant (Headless)',
        timestamp: new Date(),
        originalText: randomMessage,
        type: 'debit' as const,
        sender: 'TEST-BANK',
        processedInBackground: true,
        headlessTaskTimestamp: Date.now()
      };
      
      DeviceEventEmitter.emit('onHeadlessTransactionDetected', transactionData);
    }, 2000);
  }

  cleanup(): void {
    console.log('🧹 Cleaning up Backend SMS Service...');
    this.stopListening();
  }
}

export const smsBackendService = SMSBackendService.getInstance();