import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, DollarSign, Store, Calendar, Zap } from 'lucide-react-native';
import { useExpenses } from '@/hooks/useExpenses';
import { smsService } from '@/services/smsService';
import CategoryModal from '@/components/CategoryModal';

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('Other');
  const [loading, setLoading] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const { addExpense } = useExpenses();

  const handleAddExpense = async () => {
    if (!amount || !merchant) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        amount: numAmount,
        merchant: merchant.trim(),
        category,
        timestamp: new Date().toISOString(),
      });

      // Clear form
      setAmount('');
      setMerchant('');
      setCategory('Other');
      
      Alert.alert('Success', 'Expense added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add expense');
    }
    setLoading(false);
  };

  const handleSimulateTransaction = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'SMS simulation is only available on web for testing');
      return;
    }

    try {
      await smsService.simulateTransaction();
      Alert.alert('Success', 'Test transaction processed! Check notifications.');
    } catch (error) {
      Alert.alert('Error', 'Failed to simulate transaction');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Plus color="white" size={32} />
          </View>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Manually track your spending</Text>
        </View>
      </LinearGradient>

      {/* Form */}
      <View style={styles.form}>
        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount *</Text>
          <View style={styles.inputContainer}>
            <DollarSign color="#6B7280" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.currency}>₹</Text>
          </View>
        </View>

        {/* Merchant Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Merchant *</Text>
          <View style={styles.inputContainer}>
            <Store color="#6B7280" size={20} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Where did you spend?"
              value={merchant}
              onChangeText={setMerchant}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Calendar color="#6B7280" size={20} style={styles.inputIcon} />
            <Text style={styles.categoryText}>{category}</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddExpense}
          disabled={loading}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.addButtonGradient}
          >
            <Plus color="white" size={20} />
            <Text style={styles.addButtonText}>
              {loading ? 'Adding...' : 'Add Expense'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Test Section (Web Only) */}
        {Platform.OS === 'web' && (
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Testing (Web Only)</Text>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleSimulateTransaction}
            >
              <Zap color="#F97316" size={20} />
              <Text style={styles.testButtonText}>Simulate SMS Transaction</Text>
            </TouchableOpacity>
            <Text style={styles.testDescription}>
              This will simulate receiving an SMS transaction and show a notification
            </Text>
          </View>
        )}
      </View>

      {/* Category Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSelect={(selectedCategory) => {
          setCategory(selectedCategory);
          setCategoryModalVisible(false);
        }}
        currentCategory={category}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 56,
  },
  categoryText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  arrow: {
    fontSize: 18,
    color: '#6B7280',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '500',
  },
  testDescription: {
    fontSize: 12,
    color: '#A3A3A3',
    fontStyle: 'italic',
  },
});