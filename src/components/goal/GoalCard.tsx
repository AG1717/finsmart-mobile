import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../../types';
import { ProgressCircle } from './ProgressCircle';
import { formatCurrency, formatDate } from '../../utils/helpers/formatters';
import { COLORS, CATEGORY_INFO } from '../../utils/constants';
import { useTranslation } from 'react-i18next';

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const { i18n } = useTranslation();
  const categoryInfo = CATEGORY_INFO[goal.category];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: categoryInfo.color + '20' }]}>
          <Ionicons name={goal.icon as any} size={24} color={categoryInfo.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>
            {goal.name}
          </Text>
          {goal.dates.target && (
            <Text style={styles.date}>
              {formatDate(goal.dates.target, 'PP', i18n.language as any)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.body}>
        <ProgressCircle
          percentage={goal.progress.percentage}
          size={70}
          strokeWidth={6}
          color={categoryInfo.color}
        />
        <View style={styles.amounts}>
          <Text style={styles.currentAmount}>
            {formatCurrency(goal.amounts.current, goal.amounts.currency)}
          </Text>
          <Text style={styles.targetAmount}>
            of {formatCurrency(goal.amounts.target, goal.amounts.currency)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amounts: {
    flex: 1,
    marginLeft: 16,
  },
  currentAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  targetAmount: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
});
