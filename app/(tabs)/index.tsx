import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { goalsApi } from '../../src/services/api/goalsApi';
import { Goal } from '../../src/types';
import { formatCurrency } from '../../src/utils/helpers/formatters';
import { ProgressCircle } from '../../src/components/goal/ProgressCircle';
import { useAuthStore } from '../../src/store/authStore';

type DashboardTab = 'overview' | 'short' | 'long' | 'suggestion';
const { width, height } = Dimensions.get('window');
const uiScale = Math.max(0.78, Math.min(Math.min(width / 390, height / 844), 1.1));
const rs = (value: number) => Math.round(value * uiScale);

const kpiIcons = {
  achieved: require('../../assets/icone-achieved.jpeg'),
  short: require('../../assets/icone-short-term.jpeg'),
  long: require('../../assets/icone-long-term.jpeg'),
  saving: require('../../assets/icone-saving.jpeg'),
};

export default function DashboardScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: goalsApi.getDashboard,
  });

  const currency = user?.preferences.currency || { code: 'USD', symbol: '$' };
  const allGoals = dashboard?.recentGoals || [];

  const filteredGoals = useMemo(() => {
    if (activeTab === 'short') return allGoals.filter((g) => g.timeframe === 'short');
    if (activeTab === 'long') return allGoals.filter((g) => g.timeframe === 'long');
    return allGoals;
  }, [activeTab, allGoals]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F8AC1" />
      </View>
    );
  }

  const overview = dashboard?.overview;
  const achievedPercent = overview?.totalGoals ? (overview.completedGoals / overview.totalGoals) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(auth)/welcome')}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={rs(30)} color="#18133E" />
        </TouchableOpacity>
      </View>

      <View style={styles.kpiCard}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="kpiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0E4B74" stopOpacity="1" />
              <Stop offset="100%" stopColor="#2F8AC1" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" rx="0" fill="url(#kpiGrad)" />
        </Svg>

        <View style={styles.kpiContent}>
          <Text style={styles.kpiTopLabel}>Goal Amount reached</Text>
          <Text style={styles.kpiAmount}>
            {formatCurrency(overview?.totalCurrentAmount || 0, currency)} <Text style={styles.kpiTarget}>of {formatCurrency(overview?.totalTargetAmount || 0, currency)}</Text>
          </Text>

          <View style={styles.kpiRow}>
            <KpiBadge image={kpiIcons.achieved} label="Achieved" percentage={achievedPercent} />
            <KpiBadge image={kpiIcons.short} label="short term" percentage={dashboard?.byTimeframe.short.progress || 0} />
            <KpiBadge image={kpiIcons.long} label="Long term" percentage={dashboard?.byTimeframe.long.progress || 0} />
            <KpiBadge image={kpiIcons.saving} label="Saving" percentage={overview?.overallProgress || 0} />
          </View>
        </View>
      </View>

      <View style={styles.goalsHeader}>
        <Text style={styles.goalsTitle}>Goals</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/goal/create')}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        <TabPill label="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <TabPill label="Short term" active={activeTab === 'short'} onPress={() => setActiveTab('short')} />
        <TabPill label="Long term" active={activeTab === 'long'} onPress={() => setActiveTab('long')} />
        <TabPill label="Suggestion" active={activeTab === 'suggestion'} onPress={() => setActiveTab('suggestion')} />
      </View>

      <View style={styles.grid}>
        {filteredGoals.slice(0, 8).map((goal) => (
          <TouchableOpacity key={goal._id} style={styles.goalCard} onPress={() => router.push(`/goal/${goal._id}` as any)}>
            <View style={styles.goalCardTop}>
              <View style={styles.goalIconCircle}>
                <Ionicons name={(goal.icon as any) || 'wallet-outline'} size={rs(22)} color="#6A6A6A" />
              </View>
              <ProgressCircle percentage={goal.progress?.percentage || 0} size={rs(52)} strokeWidth={5} color="#52D38F" />
            </View>

            <Text style={styles.goalName} numberOfLines={1}>
              {goal.name}
            </Text>
            <Text style={styles.goalDate}>
              {goal.dates?.target ? new Date(goal.dates.target).toLocaleDateString() : 'No date'}
            </Text>
            <Text style={styles.goalAmountLine}>
              <Text style={styles.goalCurrent}>{formatCurrency(goal.amounts.current, goal.amounts.currency)}</Text>
              <Text style={styles.goalTarget}> of {formatCurrency(goal.amounts.target, goal.amounts.currency)}</Text>
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function TabPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tabPill, active && styles.tabPillActive]} onPress={onPress}>
      <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function KpiBadge({ image, label, percentage }: { image: any; label: string; percentage: number }) {
  return (
    <View style={styles.kpiBadge}>
      <View style={styles.kpiCircleWrap}>
        <ProgressCircle percentage={percentage} size={54} strokeWidth={4} color="#3EF18F" showPercentage={false} />
        <View style={styles.kpiImageWrap}>
          <Image source={image} style={styles.kpiImage} resizeMode="cover" />
        </View>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  contentContainer: {
    paddingBottom: rs(24),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  header: {
    paddingTop: rs(46),
    paddingHorizontal: rs(14),
    paddingBottom: rs(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: rs(24),
    color: '#111111',
  },
  headerTitle: {
    fontSize: rs(30),
    fontWeight: '700',
    color: '#101033',
  },
  kpiCard: {
    height: rs(194),
    marginHorizontal: rs(14),
    overflow: 'hidden',
    borderRadius: 0,
  },
  kpiContent: {
    flex: 1,
    paddingHorizontal: rs(10),
    paddingTop: rs(8),
  },
  kpiTopLabel: {
    color: '#FFFFFF',
    fontSize: rs(15),
    fontWeight: '500',
    marginBottom: 4,
  },
  kpiAmount: {
    color: '#FFFFFF',
    fontSize: rs(34),
    fontWeight: '700',
  },
  kpiTarget: {
    fontSize: rs(24),
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
  },
  kpiRow: {
    marginTop: rs(6),
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  kpiBadge: {
    alignItems: 'center',
    width: rs(72),
  },
  kpiCircleWrap: {
    width: rs(52),
    height: rs(52),
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiImageWrap: {
    position: 'absolute',
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    overflow: 'hidden',
  },
  kpiImage: {
    width: '100%',
    height: '100%',
  },
  kpiLabel: {
    marginTop: rs(4),
    color: '#FFFFFF',
    fontSize: rs(13),
    fontWeight: '500',
    textAlign: 'center',
  },
  goalsHeader: {
    marginTop: rs(14),
    marginHorizontal: rs(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalsTitle: {
    fontSize: rs(32),
    fontWeight: '700',
    color: '#15153F',
  },
  addButton: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(22),
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: rs(30),
    fontWeight: '600',
    marginTop: -2,
  },
  tabsRow: {
    marginTop: rs(12),
    marginHorizontal: rs(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(6),
  },
  tabPill: {
    backgroundColor: '#E8E8EA',
    borderRadius: rs(10),
    paddingHorizontal: rs(12),
    height: rs(38),
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: '#2F8AC1',
  },
  tabPillText: {
    color: '#1D1D1D',
    fontSize: rs(14),
    fontWeight: '500',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  grid: {
    marginTop: rs(14),
    marginHorizontal: rs(14),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: rs(10),
  },
  goalCard: {
    width: '48.3%',
    backgroundColor: '#F9F9FA',
    borderRadius: rs(10),
    padding: rs(9),
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  goalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(7),
  },
  goalIconCircle: {
    width: rs(46),
    height: rs(46),
    borderRadius: rs(23),
    backgroundColor: '#EFEFF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: rs(18),
    fontWeight: '700',
    color: '#0F0F11',
    marginBottom: rs(2),
  },
  goalDate: {
    fontSize: rs(12),
    color: '#8A8A94',
    marginBottom: rs(3),
  },
  goalAmountLine: {
    fontSize: rs(13),
  },
  goalCurrent: {
    fontSize: rs(13),
    color: '#1C96D6',
    fontWeight: '700',
  },
  goalTarget: {
    fontSize: rs(13),
    color: '#767676',
    fontWeight: '500',
  },
});
