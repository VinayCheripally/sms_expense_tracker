// SMS Pattern Matching Service - Converted from Python
// Handles spam detection, transaction identification, and amount extraction

interface ProcessResult {
  status: 'spam' | 'transactional' | 'non-transactional';
  type: 'debit' | 'credit' | null;
  amount: string | null;
}

interface AmountResult {
  type: 'debit' | 'credit' | null;
  amount: string | null;
}

// Precompiled regex patterns for better performance
const SPAM_PATTERNS = [
  /http[s]?:\/\//i,
  /!!!+/i,
  /[\w\.-]+@[\w\.-]+/i
];

const TRANSACTION_PATTERNS = [
  /debited.*(?:account|a\/c|acc)/i,
  /credited.*(?:account|a\/c|acc)/i,
  /payment.*(?:successful|done|received)/i,
  /(?:rs\.?|₹|inr)\s?\d/i,
  /ref(?:erence)?\s?no\.?\s?\d+/i
];

const DEBIT_PATTERNS = [
  /a\/?c\s?[xX*]*\d+\s+debited\s+for\s+(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /your\s+(?:a\/?c(?:count)?(?:\snumber)?\s[xX*]\d+).?debited\s+(?:by|for)\s+(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /transaction\s+(?:of\s?)?(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?).*?debited/i,
  /debit(?:ed)?\s+(?:of|for)\s+(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /atm\s+wdl.*?(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /(?:neft|imps|upi|transfer|txn).*?debited\s+(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /your\s(?:a\/?c|account)\s(?:is\s)?debited\s+(?:rs\.?|inr|₹)?\s?([\d,]+(?:\.\d{1,2})?)/i,
  /(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)\s?(?:has\s)?been\s?debited/i,
  /amount\s?(?:is|:)\s?(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i
];

const CREDIT_PATTERNS = [
  /(?:credited|credit(?:ed)?)\s?(?:with|by|:)?\s?(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i,
  /your\s(?:a\/?c|account)\s(?:is\s)?credited(?:\swith)?\s?(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)/i
];

// Convert keyword arrays to Sets for fast lookup
const SPAM_KEYWORDS_SET = new Set([
  '100% free', 'act now', 'apply now', 'free gift', 'money back', 'limited time', 'winner',
  'exclusive deal', 'click here', 'you have been selected', 'be your own boss', 'free trial',
  'congratulations', 'you won', 'claim now', 'urgent', 'hurry', 'expires today', 'last chance',
  'no obligation', 'risk free', 'satisfaction guaranteed', 'special promotion', 'limited offer',
  'call now', 'order now', 'buy now', 'subscribe', 'unsubscribe', 'opt out', 'stop sms',
  'lottery', 'jackpot', 'casino', 'gambling', 'bet', 'loan approved', 'credit approved',
  'instant cash', 'easy money', 'work from home', 'make money fast', 'get rich quick',
  'miracle', 'breakthrough', 'amazing', 'incredible', 'fantastic', 'unbelievable',
  'free consultation', 'free quote', 'free estimate', 'no cost', 'no fee', 'no charge',
  'double your income', 'financial freedom', 'debt relief', 'consolidate debt',
  'viagra', 'cialis', 'pharmacy', 'prescription', 'medicine', 'pills', 'drugs',
  'weight loss', 'lose weight', 'diet pills', 'fat burner', 'slim down',
  'mlm', 'multi level marketing', 'pyramid scheme', 'network marketing',
  'investment opportunity', 'stock alert', 'penny stock', 'trading', 'forex'
].map(k => k.toLowerCase()));

const TRANSACTION_KEYWORDS_SET = new Set([
  'debited', 'credited', 'transaction', 'paid', 'payment', 'transferred', 'upi', 'imps', 'neft',
  'netbanking', 'wallet', 'purchase', 'merchant', 'ref no', 'a/c', 'acc', 'account',
  'balance', 'avl bal', 'available balance', 'txn', 'transaction id', 'reference number',
  'atm', 'pos', 'online', 'mobile banking', 'internet banking', 'card', 'debit card',
  'credit card', 'bank', 'branch', 'ifsc', 'micr', 'cheque', 'dd', 'demand draft',
  'rtgs', 'swift', 'wire transfer', 'remittance', 'money transfer', 'fund transfer',
  'paytm', 'phonepe', 'gpay', 'google pay', 'bhim', 'amazon pay', 'mobikwik',
  'freecharge', 'paypal', 'razorpay', 'cashfree', 'instamojo', 'payu', 'ccavenue',
  'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'yes bank', 'pnb', 'bob', 'canara',
  'union bank', 'indian bank', 'central bank', 'syndicate', 'allahabad', 'vijaya',
  'corporation bank', 'oriental bank', 'andhra bank', 'dena bank', 'idbi'
].map(k => k.toLowerCase()));

export class SMSPatternMatcher {
  static isSpam(msgLower: string): boolean {
    // Check for spam keywords
    for (const keyword of SPAM_KEYWORDS_SET) {
      if (msgLower.includes(keyword)) {
        return true;
      }
    }
    
    // Check for spam patterns
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(msgLower)) {
        return true;
      }
    }
    
    return false;
  }

  static isTransactional(msgLower: string): boolean {
    // Check for transaction keywords
    for (const keyword of TRANSACTION_KEYWORDS_SET) {
      if (msgLower.includes(keyword)) {
        return true;
      }
    }
    
    // Check for transaction patterns
    for (const pattern of TRANSACTION_PATTERNS) {
      if (pattern.test(msgLower)) {
        return true;
      }
    }
    
    return false;
  }

  static extractAmount(msgLower: string): AmountResult {
    // Check debit patterns first
    for (const pattern of DEBIT_PATTERNS) {
      const match = pattern.exec(msgLower);
      if (match && match[1]) {
        return {
          type: 'debit',
          amount: match[1].replace(/,/g, '')
        };
      }
    }
    
    // Check credit patterns
    for (const pattern of CREDIT_PATTERNS) {
      const match = pattern.exec(msgLower);
      if (match && match[1]) {
        return {
          type: 'credit',
          amount: match[1].replace(/,/g, '')
        };
      }
    }
    
    return {
      type: null,
      amount: null
    };
  }

  static processMessage(msg: string): ProcessResult {
    const msgLower = msg.toLowerCase();
    
    // First check if it's spam
    if (this.isSpam(msgLower)) {
      return {
        status: 'spam',
        type: null,
        amount: null
      };
    }
    
    // Then check if it's transactional
    if (this.isTransactional(msgLower)) {
      const result = this.extractAmount(msgLower);
      return {
        status: 'transactional',
        type: result.type,
        amount: result.amount
      };
    }
    
    // Otherwise it's non-transactional
    return {
      status: 'non-transactional',
      type: null,
      amount: null
    };
  }

  // Enhanced merchant extraction with better patterns
  static extractMerchant(msg: string): string {
    const msgLower = msg.toLowerCase();
    
    // Common merchant extraction patterns
    const merchantPatterns = [
      // "at MERCHANT" or "to MERCHANT"
      /(?:at|to)\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+via|\s+using|\s+ref|\s+txn|\.|\s*$)/i,
      // "for MERCHANT"
      /for\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+via|\s+using|\s+ref|\s+txn|\.|\s*$)/i,
      // "MERCHANT transaction"
      /([A-Za-z0-9\s&.-]+?)\s+transaction/i,
      // "paid to MERCHANT"
      /paid\s+to\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+via|\s+using|\s+ref|\s+txn|\.|\s*$)/i,
      // "transfer to MERCHANT"
      /transfer\s+to\s+([A-Za-z0-9\s&.-]+?)(?:\s+on|\s+via|\s+using|\s+ref|\s+txn|\.|\s*$)/i
    ];
    
    for (const pattern of merchantPatterns) {
      const match = pattern.exec(msg);
      if (match && match[1]) {
        let merchant = match[1].trim();
        
        // Clean up the merchant name
        merchant = merchant
          .replace(/[^\w\s&.-]/g, ' ') // Remove special characters except &, ., -
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
        
        // Skip if it's too short or contains common non-merchant words
        if (merchant.length > 2 && !this.isCommonNonMerchant(merchant.toLowerCase())) {
          return merchant.slice(0, 50); // Limit length
        }
      }
    }
    
    return 'Unknown Merchant';
  }

  private static isCommonNonMerchant(text: string): boolean {
    const nonMerchantWords = new Set([
      'account', 'a/c', 'acc', 'bank', 'branch', 'atm', 'pos', 'online',
      'mobile', 'internet', 'card', 'debit', 'credit', 'transaction', 'txn',
      'payment', 'transfer', 'upi', 'imps', 'neft', 'rtgs', 'ref', 'reference',
      'number', 'no', 'id', 'balance', 'avl', 'available', 'limit', 'date',
      'time', 'amount', 'rs', 'inr', 'rupees', 'paisa', 'your', 'you', 'has',
      'been', 'is', 'was', 'will', 'be', 'for', 'from', 'to', 'at', 'on',
      'via', 'using', 'with', 'by', 'in', 'of', 'the', 'and', 'or', 'but'
    ]);
    
    return nonMerchantWords.has(text);
  }

  // Test function for debugging
  static testMessage(msg: string): void {
    console.log(`>>> ${msg}`);
    console.log('→', this.processMessage(msg));
    console.log('Merchant:', this.extractMerchant(msg));
    console.log('');
  }
}

// Export for use in other modules
export default SMSPatternMatcher;