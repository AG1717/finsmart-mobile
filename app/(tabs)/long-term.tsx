import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { goalsApi } from '../../src/services/api/goalsApi';
import { GoalCard } from '../../src/components/goal/GoalCard';
import { COLORS } from '../../src/utils/constants';

export default function LongTermScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['goals', 'long'],
    queryFn: () => goalsApi.getGoals({ timeframe: 'long' }),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('timeframes.long')}</Text>
        <Text style={styles.count}>
          {data?.goals.length || 0} {t('goals.title').toLowerCase()}
        </Text>
      </View>

      {data?.goals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('goals.noGoals')}</Text>
          <Text style={styles.emptySubtext}>{t('goals.createFirst')}</Text>
        </View>
      ) : (
        <FlatList
          data={data?.goals}
          renderItem={({ item }) => <GoalCard goal={item} onPress={() => router.push(`/goal/${item._id}` as any)} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[400],
  },
});
