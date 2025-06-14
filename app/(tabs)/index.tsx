import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, Wallet, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useExpenses } from '@/hooks/useExpenses';
import ExpenseCard from '@/components/ExpenseCard';
import NotificationPermissionModal from '@/components/NotificationPermissionModal';
import { notificationService } from '@/services/notificationService';
import { smsBackendService } from '@/services/smsBackendService';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { expenses, loading, refreshExpenses } = useExpenses();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationPermissionChecked, setNotificationPermissionChecked] = useState(false);

  useEffect(() => {
    if (user) {
      initializeServices();
    }
  }, [user]);

  const initializeServices = async () => {
    try {
      // Initialize notification service
      await notificationService.initialize();
      
      // Check notification permission status
      const permissionStatus = await notificationService.checkPermissionStatus();
      
      if (permissionStatus === 'undetermined' && !notificationPermissionChecked) {
        // Show permission modal for first-time users
        setTimeout(() => {
          setShowNotificationModal(true);
        }, 2000); // Show after 2 seconds
      }
      
      setNotificationPermissionChecked(true);
      
      // Start backend SMS service (this handles background processing)
      await smsBackendService.initialize();
      console.log('✅ Backend SMS service initialized and listening');
      
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshExpenses();
    setRefreshing(false);
  };

  const handleNotificationPermissionGranted = () => {
    console.log('Notification permission granted');
  };

  // Calculate analytics
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  
  const thisMonthExpenses = expenses.filter(
    expense => new Date(expense.timestamp) >= monthStart
  );
  
  const totalThisMonth = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Category breakdown
  const categoryTotals = thisMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const recentExpenses = expenses.slice(0, 5);

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.userName}>{user?.email?.split('@')[0]}</Text>
            
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>This Month's Spending</Text>
                <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                  {balanceVisible ? (
                    <Eye color="white" size={20} />
                  ) : (
                    <EyeOff color="white" size={20} />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {balanceVisible ? `₹${totalThisMonth.toFixed(2)}` : '••••••'}
              </Text>
              <Text style={styles.backendStatus}>
                🔄 Backend SMS monitoring active
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Wallet color="#10B981" size={24} />
            <Text style={styles.statValue}>{thisMonthExpenses.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingUp color="#F97316" size={24} />
            <Text style={styles.statValue}>
              ₹{thisMonthExpenses.length > 0 ? (totalThisMonth / thisMonthExpenses.length).toFixed(0) : '0'}
            </Text>
            <Text style={styles.statLabel}>Avg per Day</Text>
          </View>
          
          <View style={styles.statCard}>
            <TrendingDown color="#EF4444" size={24} />
            <Text style={styles.statValue}>{Object.keys(categoryTotals).length}</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
        </View>

        {/* Top Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          {topCategories.length > 0 ? (
            topCategories.map(([category, amount], index) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryAmount}>₹{amount.toFixed(2)}</Text>
                </View>
                <View style={styles.categoryBar}>
                  <View 
                    style={[
                      styles.categoryBarFill,
                      { width: `${(amount / totalThisMonth) * 100}%` }
                    ]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No expenses this month</Text>
          )}
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {recentExpenses.length > 0 ? (
            recentExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} />
            ))
          ) : (
            <Text style={styles.emptyText}>No recent expenses</Text>
          )}
        </View>
      </ScrollView>

      {/* Notification Permission Modal */}
      <NotificationPermissionModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onPermissionGranted={handleNotificationPermissionGranted}
      />
    </>
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
  },
  headerContent: {
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  backendStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  categoryItem: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categoryBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
});