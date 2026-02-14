import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { goalsApi } from '../../src/services/api/goalsApi';
import { GoalCard } from '../../src/components/goal/GoalCard';
import { formatCurrency } from '../../src/utils/helpers/formatters';
import { COLORS, CATEGORY_INFO } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: goalsApi.getDashboard,
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const currency = user?.preferences.currency || { code: 'USD', symbol: '$' };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {t('auth.welcome')}, {user?.username}!
        </Text>
        <Text style={styles.title}>{t('dashboard.title')}</Text>
      </View>

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewLabel}>{t('dashboard.goalAmount')}</Text>
        <Text style={styles.overviewAmount}>
          {formatCurrency(dashboard?.overview.totalCurrentAmount || 0, currency)}
        </Text>
        <Text style={styles.overviewTarget}>
          {t('dashboard.of')} {formatCurrency(dashboard?.overview.totalTargetAmount || 0, currency)}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${dashboard?.overview.overallProgress || 0}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{dashboard?.overview.overallProgress || 0}%</Text>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        {Object.entries(dashboard?.byCategory || {}).map(([category, stats]: [string, any]) => (
          <View
            key={category}
            style={[
              styles.categoryBadge,
              { backgroundColor: CATEGORY_INFO[category as keyof typeof CATEGORY_INFO].color + '20' },
            ]}
          >
            <Ionicons
              name={CATEGORY_INFO[category as keyof typeof CATEGORY_INFO].icon as any}
              size={24}
              color={CATEGORY_INFO[category as keyof typeof CATEGORY_INFO].color}
            />
            <Text style={styles.categoryCount}>{stats.count}</Text>
            <Text style={styles.categoryLabel}>{t(`categories.${category}`)}</Text>
          </View>
        ))}
      </View>

      {/* Recent Goals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('dashboard.recentGoals')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/short-term')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        {dashboard?.recentGoals.map((goal) => (
          <GoalCard key={goal._id} goal={goal} onPress={() => router.push(`/goal/${goal._id}` as any)} />
        ))}
      </View>

      {/* Add Goal Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/goal/create')}>
        <Ionicons name="add" size={32} color={COLORS.white} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: COLORS.white,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  overviewCard: {
    backgroundColor: COLORS.primary,
    margin: 16,
    padding: 24,
    borderRadius: 16,
  },
  overviewLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  overviewAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  overviewTarget: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryBadge: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginTop: 4,
  },
  categoryLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
