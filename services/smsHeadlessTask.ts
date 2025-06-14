/**
 * Headless JS Task for Background SMS Processing
 * 
 * This task runs in the background even when the app is not active,
 * ensuring reliable SMS processing and transaction detection.
 */

import { DeviceEventEmitter } from 'react-native';
import SMSPatternMatcher from './smsPatterns';

interface HeadlessTaskData {
  smsBody: string;
  sender: string;
  timestamp: number;
}

// The headless task function that will be called by the native backend
const SmsHeadlessTask = async (taskData: HeadlessTaskData) => {
  console.log('🚀 Headless JS Task started for SMS processing');
  console.log('📱 SMS Data:', {
    sender: taskData.sender,
    bodyPreview: taskData.smsBody?.substring(0, 50) + '...',
    timestamp: new Date(taskData.timestamp).toISOString()
  });

  try {
    // Process the SMS using our enhanced pattern matcher
    const analysisResult = SMSPatternMatcher.processMessage(taskData.smsBody);
    
    console.log('🔍 Headless Task SMS Analysis:', analysisResult);
    
    if (analysisResult.status === 'spam') {
      console.log('🚫 Headless Task: SMS identified as spam - ignoring');
      return;
    }
    
    if (analysisResult.status === 'transactional' && analysisResult.amount && analysisResult.type) {
      console.log('💳 Headless Task: Transaction SMS detected!');
      
      // Extract merchant information
      const merchant = SMSPatternMatcher.extractMerchant(taskData.smsBody);
      
      const transactionData = {
        amount: parseFloat(analysisResult.amount),
        merchant: merchant,
        timestamp: new Date(taskData.timestamp),
        originalText: taskData.smsBody,
        type: analysisResult.type,
        sender: taskData.sender
      };
      
      console.log('💰 Headless Task Transaction Data:', {
        amount: transactionData.amount,
        merchant: transactionData.merchant,
        type: transactionData.type,
        sender: transactionData.sender
      });
      
      // Only process debit transactions for expense tracking
      if (transactionData.type === 'debit') {
        // Emit event to DeviceEventEmitter for the main app to handle
        // This ensures the transaction is processed when the app becomes active
        DeviceEventEmitter.emit('onSmsReceived', taskData.smsBody);
        
        // Also emit a special headless event with more context
        DeviceEventEmitter.emit('onHeadlessTransactionDetected', {
          ...transactionData,
          processedInBackground: true,
          headlessTaskTimestamp: Date.now()
        });
        
        console.log('✅ Headless Task: Transaction event emitted to DeviceEventEmitter');
      } else {
        console.log('💚 Headless Task: Credit transaction detected but not processed for expense tracking');
      }
    } else {
      console.log('📝 Headless Task: Non-transactional SMS - ignoring');
    }
    
    console.log('✅ Headless JS Task completed successfully');
    
  } catch (error) {
    console.error('❌ Headless JS Task error:', error);
  }
};

// Export the headless task
export default SmsHeadlessTask;

// Register the headless task with React Native
import { AppRegistry } from 'react-native';

// Register the headless task with a specific name that the native code will call
AppRegistry.registerHeadlessTask('SmsHeadlessTask', () => SmsHeadlessTask);

console.log('📋 Headless JS Task registered: SmsHeadlessTask');