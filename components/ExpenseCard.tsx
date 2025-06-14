import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingBag, Coffee, Car, Home, Gamepad2, MoreHorizontal } from 'lucide-react-native';
import { Expense } from '@/types/database';

interface ExpenseCardProps {
  expense: Expense;
  onPress?: () => void;
}

const categoryIcons = {
  'Food': Coffee,
  'Shopping': ShoppingBag,
  'Transport': Car,
  'Bills': Home,
  'Entertainment': Gamepad2,
  'Other': MoreHorizontal,
};

const categoryColors = {
  'Food': '#F97316',
  'Shopping': '#8B5CF6',
  'Transport': '#06B6D4',
  'Bills': '#EF4444',
  'Entertainment': '#EC4899',
  'Other': '#6B7280',
};

export default function ExpenseCard({ expense, onPress }: ExpenseCardProps) {
  const IconComponent = categoryIcons[expense.category as keyof typeof categoryIcons] || MoreHorizontal;
  const color = categoryColors[expense.category as keyof typeof categoryColors] || '#6B7280';
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <IconComponent color={color} size={24} />
        </View>
        
        <View style={styles.details}>
          <Text style={styles.merchant}>{expense.merchant}</Text>
          <Text style={styles.category}>{expense.category}</Text>
          <Text style={styles.date}>{formatDate(expense.timestamp)}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{expense.amount.toFixed(2)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  details: {
    flex: 1,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
});