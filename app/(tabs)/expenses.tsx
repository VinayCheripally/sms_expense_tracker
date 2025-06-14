import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Search, Filter } from 'lucide-react-native';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryModal from '@/components/CategoryModal';
import { Expense } from '@/types/database';

export default function ExpensesScreen() {
  const { expenses, loading, refreshExpenses, updateExpense } = useExpenses();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExpenses();
    setRefreshing(false);
  };

  const handleExpensePress = (expense: Expense) => {
    setSelectedExpense(expense);
    setCategoryModalVisible(true);
  };

  const handleCategorySelect = async (category: string) => {
    if (selectedExpense) {
      try {
        await updateExpense(selectedExpense.id, { category });
      } catch (error) {
        console.error('Failed to update category:', error);
      }
    }
    setSelectedExpense(null);
  };

  const renderExpense = ({ item }: { item: Expense }) => (
    <ExpenseCard 
      expense={item} 
      onPress={() => handleExpensePress(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Expenses</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Search color="#6B7280" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Filter color="#6B7280" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expenses List */}
      <FlatList
        data={expenses}
        renderItem={renderExpense}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No expenses found</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your expenses by categorizing SMS transactions
            </Text>
          </View>
        }
      />

      {/* Category Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => {
          setCategoryModalVisible(false);
          setSelectedExpense(null);
        }}
        onSelect={handleCategorySelect}
        currentCategory={selectedExpense?.category}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});