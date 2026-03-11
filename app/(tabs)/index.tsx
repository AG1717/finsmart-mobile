import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Dimensions, Modal, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { goalsApi } from '../../src/services/api/goalsApi';
import { userApi } from '../../src/services/api/userApi';
import { Category, Timeframe } from '../../src/types';
import { formatCurrency } from '../../src/utils/helpers/formatters';
import { ProgressCircle } from '../../src/components/goal/ProgressCircle';
import { useAuthStore } from '../../src/store/authStore';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [isResettingGoals, setIsResettingGoals] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: goalsApi.getDashboard,
  });
  const { data: goalsData } = useQuery({
    queryKey: ['goals', 'dashboard-list'],
    queryFn: () => goalsApi.getGoals({ page: 1, limit: 50 }),
  });

  const displayName =
    user?.username?.trim() ||
    user?.profile?.firstName?.trim() ||
    user?.email?.split('@')[0] ||
    'Utilisateur';
  const avatarUrl = user?.profile?.avatar?.trim() || '';
  const currency = user?.preferences.currency || { code: 'USD', symbol: '$' };
  const allGoals = goalsData?.goals?.length ? goalsData.goals : (dashboard?.recentGoals || []);

  const handleResetGoals = () => {
    const confirmReset = async () => {
      try {
        setIsResettingGoals(true);
        await goalsApi.resetGoals();
        // Optimistic local reset to reflect zeroed counters immediately
        queryClient.setQueryData(['dashboard'], (prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            overview: {
              ...prev.overview,
              totalCurrentAmount: 0,
              totalTargetAmount: 0,
              overallProgress: 0,
              completedGoals: 0,
              activeGoals: prev.overview?.totalGoals ?? prev.overview?.activeGoals ?? 0,
            },
            byTimeframe: {
              short: { ...prev.byTimeframe?.short, currentAmount: 0, targetAmount: 0, progress: 0 },
              long: { ...prev.byTimeframe?.long, currentAmount: 0, targetAmount: 0, progress: 0 },
            },
            byCategory: {
              survival: { ...prev.byCategory?.survival, currentAmount: 0, targetAmount: 0, progress: 0 },
              necessity: { ...prev.byCategory?.necessity, currentAmount: 0, targetAmount: 0, progress: 0 },
              lifestyle: { ...prev.byCategory?.lifestyle, currentAmount: 0, targetAmount: 0, progress: 0 },
            },
            recentGoals: (prev.recentGoals || []).map((g: any) => ({
              ...g,
              amounts: { ...g.amounts, current: 0, target: 0 },
              progress: { ...g.progress, percentage: 0 },
              status: 'active',
              dates: { ...g.dates, completed: null, target: null, started: new Date().toISOString() },
              metadata: { ...g.metadata, contributions: [], milestones: [] },
            })),
          };
        });
        queryClient.setQueryData(['goals', 'dashboard-list'], (prev: any) => {
          if (!prev?.goals) return prev;
          return {
            ...prev,
            goals: prev.goals.map((g: any) => ({
              ...g,
              amounts: { ...g.amounts, current: 0, target: 0 },
              progress: { ...g.progress, percentage: 0 },
              status: 'active',
              dates: { ...g.dates, completed: null, target: null, started: new Date().toISOString() },
              metadata: { ...g.metadata, contributions: [], milestones: [] },
            })),
          };
        });
        queryClient.setQueryData(['goals'], (prev: any) => {
          if (!prev?.goals) return prev;
          return {
            ...prev,
            goals: prev.goals.map((g: any) => ({
              ...g,
              amounts: { ...g.amounts, current: 0, target: 0 },
              progress: { ...g.progress, percentage: 0 },
              status: 'active',
              dates: { ...g.dates, completed: null, target: null, started: new Date().toISOString() },
              metadata: { ...g.metadata, contributions: [], milestones: [] },
            })),
          };
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
        ]);
        setProfileModalVisible(false);
        if (Platform.OS === 'web') {
          window.alert(t('profile.resetGoalsSuccess') || 'Goals reset successfully');
        } else {
          Alert.alert(t('common.success') || 'Success', t('profile.resetGoalsSuccess') || 'Goals reset successfully');
        }
      } catch (error: any) {
        const status = error?.response?.status;
        const serverMessage =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message;
        const errorText = serverMessage
          ? `${serverMessage}${status ? ` (HTTP ${status})` : ''}`
          : `${t('profile.resetGoalsError') || 'Error resetting goals'}${status ? ` (HTTP ${status})` : ''}`;
        if (Platform.OS === 'web') {
          window.alert(errorText);
        } else {
          Alert.alert(t('common.error') || 'Error', errorText);
        }
      } finally {
        setIsResettingGoals(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(t('profile.resetGoalsConfirmBody') || 'Are you sure you want to reset all goals?')) {
        confirmReset();
      }
    } else {
      Alert.alert(
        t('profile.resetGoalsConfirmTitle') || 'Reset Goals',
        t('profile.resetGoalsConfirmBody') || 'Are you sure you want to reset all goals? This action cannot be undone.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('profile.resetGoalsConfirmAction') || 'Reset',
            style: 'destructive',
            onPress: confirmReset,
          },
        ]
      );
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout().then(() => router.replace('/(auth)/welcome'));
      }
    } else {
      Alert.alert(
        t('auth.logout') || 'Logout',
        'Are you sure you want to logout?',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('auth.logout') || 'Logout',
            style: 'destructive',
            onPress: async () => {
              await logout();
              router.replace('/(auth)/welcome');
            },
          },
        ]
      );
    }
  };

  const filteredGoals = useMemo(() => {
    // Objectifs suggérés pour l'onglet "Suggestion"
    const suggestedGoals = [
      {
        _id: 'sugg-1',
        name: t('dashboard.suggestionEmergency') || 'Emergency Fund',
        category: 'survival' as Category,
        timeframe: 'long' as Timeframe,
        amounts: { current: 0, target: 5000, currency: currency },
        icon: 'shield-checkmark-outline',
        dates: { target: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionEmergencyDesc') || 'Build a safety net',
        suggested: true,
      },
      {
        _id: 'sugg-2',
        name: t('dashboard.suggestionVacation') || 'Vacation Fund',
        category: 'lifestyle' as Category,
        timeframe: 'short' as Timeframe,
        amounts: { current: 0, target: 2000, currency: currency },
        icon: 'airplane-outline',
        dates: { target: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionVacationDesc') || 'Plan your adventure',
        suggested: true,
      },
      {
        _id: 'sugg-3',
        name: t('dashboard.suggestionEducation') || 'Education',
        category: 'necessity' as Category,
        timeframe: 'long' as Timeframe,
        amounts: { current: 0, target: 10000, currency: currency },
        icon: 'school-outline',
        dates: { target: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionEducationDesc') || 'Invest in skills',
        suggested: true,
      },
      {
        _id: 'sugg-4',
        name: t('dashboard.suggestionCar') || 'New Car',
        category: 'necessity' as Category,
        timeframe: 'long' as Timeframe,
        amounts: { current: 0, target: 15000, currency: currency },
        icon: 'car-outline',
        dates: { target: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionCarDesc') || 'Save for vehicle',
        suggested: true,
      },
      {
        _id: 'sugg-5',
        name: t('dashboard.suggestionHome') || 'Home Down Payment',
        category: 'necessity' as Category,
        timeframe: 'long' as Timeframe,
        amounts: { current: 0, target: 25000, currency: currency },
        icon: 'home-outline',
        dates: { target: new Date(new Date().setFullYear(new Date().getFullYear() + 3)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionHomeDesc') || 'Prepare your down payment',
        suggested: true,
      },
      {
        _id: 'sugg-6',
        name: t('dashboard.suggestionBusiness') || 'Small Business',
        category: 'lifestyle' as Category,
        timeframe: 'long' as Timeframe,
        amounts: { current: 0, target: 12000, currency: currency },
        icon: 'briefcase-outline',
        dates: { target: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionBusinessDesc') || 'Start a side project',
        suggested: true,
      },
      {
        _id: 'sugg-7',
        name: t('dashboard.suggestionHealth') || 'Health Protection',
        category: 'survival' as Category,
        timeframe: 'short' as Timeframe,
        amounts: { current: 0, target: 1500, currency: currency },
        icon: 'medkit-outline',
        dates: { target: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0] },
        description: t('dashboard.suggestionHealthDesc') || 'Cover medical emergencies',
        suggested: true,
      },
    ];
    
    if (activeTab === 'short') return allGoals.filter((g) => g.timeframe === 'short');
    if (activeTab === 'long') return allGoals.filter((g) => g.timeframe === 'long');
    if (activeTab === 'suggestion') return suggestedGoals;
    return allGoals;
  }, [activeTab, allGoals, currency, t]);

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
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.profileButtonContent}>
              <Ionicons name="person-circle-outline" size={rs(32)} color="#18133E" />
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileButtonUsername} numberOfLines={1}>
                  {displayName}
                </Text>
              </View>
            </View>
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
        {filteredGoals.map((goal: any) => (
          <TouchableOpacity 
            key={goal._id} 
            style={styles.goalCard} 
            onPress={() => {
              if (goal.suggested) {
                // Pour les objectifs suggérés, ouvrir create avec pré-remplissage
                router.push({
                  pathname: '/goal/create',
                  params: {
                    name: goal.name,
                    description: goal.description,
                    category: goal.category,
                    timeframe: goal.timeframe,
                    targetAmount: goal.amounts.target,
                    icon: goal.icon,
                  }
                } as any);
              } else {
                router.push(`/goal/${goal._id}` as any);
              }
            }}
          >
            <View style={styles.goalCardTop}>
              <View style={styles.goalIconCircle}>
                <Ionicons name={(goal.icon as any) || 'wallet-outline'} size={rs(22)} color="#6A6A6A" />
              </View>
              <ProgressCircle percentage={goal.progress?.percentage || (goal.suggested ? 0 : 0)} size={rs(52)} strokeWidth={5} color="#52D38F" />
            </View>

            <Text style={styles.goalName} numberOfLines={1}>
              {goal.name}
            </Text>
            {goal.suggested && (
              <Text style={styles.goalSuggestionLabel}>
                {t('dashboard.suggested') || 'Suggested'}
              </Text>
            )}
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

    <ProfileModal
      visible={profileModalVisible}
      onClose={() => setProfileModalVisible(false)}
      displayName={displayName}
      avatarUrl={avatarUrl}
      email={user?.email || ''}
      currency={currency}
      overview={dashboard?.overview}
      onResetGoals={handleResetGoals}
      onLogout={handleLogout}
      isResettingGoals={isResettingGoals}
      user={user}
      queryClient={queryClient}
      onUserUpdated={setUser}
    />
    </>
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
        <ProgressCircle percentage={percentage} size={rs(64)} strokeWidth={5} color="#3EF18F" showPercentage={false} />
        <View style={styles.kpiImageWrap}>
          <Image source={image} style={styles.kpiImage} resizeMode="cover" />
        </View>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  displayName: string;
  avatarUrl: string;
  email: string;
  currency: any;
  overview: any;
  onResetGoals: () => void;
  onLogout: () => void;
  isResettingGoals: boolean;
  user: any;
  queryClient: any;
  onUserUpdated: (user: any) => void;
}

function ProfileModal({
  visible,
  onClose,
  displayName,
  avatarUrl,
  email,
  currency,
  overview,
  onResetGoals,
  onLogout,
  isResettingGoals,
  user,
  queryClient,
  onUserUpdated,
}: ProfileModalProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'XOF', symbol: 'CFA', name: 'West African Franc' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const changeCurrency = async (newCurrency: any) => {
    try {
      const updatedUser = await userApi.updateProfile({
        preferences: {
          currency: {
            code: newCurrency.code,
            symbol: newCurrency.symbol,
          },
        },
      });
      onUserUpdated(updatedUser);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
      ]);
      if (Platform.OS === 'web') {
        window.alert(t('profile.currencyChanged') || 'Currency changed successfully');
      } else {
        Alert.alert(t('common.success') || 'Success', t('profile.currencyChanged') || 'Currency changed successfully');
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(t('common.error') || 'Error');
      } else {
        Alert.alert(t('common.error') || 'Error', t('common.error') || 'Error');
      }
    }
  };

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalFullScreen}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={rs(24)} color="#18133E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('profile.title') || 'Profile'}</Text>
            <View style={{ width: rs(24) }} />
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar & User Info */}
            <View style={styles.modalUserSection}>
              <View style={styles.modalAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.modalAvatarImage} />
                ) : (
                  <Ionicons name="person" size={rs(50)} color="#FFF" />
                )}
              </View>
              <Text style={styles.modalUsername}>{displayName}</Text>
              <Text style={styles.modalEmail}>{email}</Text>

              {/* Quick Stats */}
              {overview && (
                <View style={styles.modalStatsContainer}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{overview.totalGoals || 0}</Text>
                    <Text style={styles.modalStatLabel}>{t('dashboard.goals') || 'Goals'}</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{overview.completedGoals || 0}</Text>
                    <Text style={styles.modalStatLabel}>{t('dashboard.completed') || 'Completed'}</Text>
                  </View>
                  <View style={styles.modalStatDivider} />
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{Math.round(overview.overallProgress || 0)}%</Text>
                    <Text style={styles.modalStatLabel}>{t('dashboard.progress') || 'Progress'}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Suggestions */}
            <View style={styles.modalSuggestionsSection}>
              <Text style={styles.modalSectionTitle}>{t('profile.language') || 'Language'}</Text>
              <View style={styles.languageButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.currencyLanguageButton,
                    i18n.language === 'en' && styles.currencyLanguageButtonActive,
                  ]}
                  onPress={() => changeLanguage('en')}
                >
                  <Text
                    style={[
                      styles.currencyLanguageButtonText,
                      i18n.language === 'en' && styles.currencyLanguageButtonTextActive,
                    ]}
                  >
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.currencyLanguageButton,
                    i18n.language === 'fr' && styles.currencyLanguageButtonActive,
                  ]}
                  onPress={() => changeLanguage('fr')}
                >
                  <Text
                    style={[
                      styles.currencyLanguageButtonText,
                      i18n.language === 'fr' && styles.currencyLanguageButtonTextActive,
                    ]}
                  >
                    Français
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: rs(16) }]}>
                {t('profile.currency') || 'Currency'}
              </Text>
              <View style={styles.currencyGrid}>
                {currencies.map((curr) => (
                  <TouchableOpacity
                    key={curr.code}
                    style={[
                      styles.currencyOption,
                      currency?.code === curr.code && styles.currencyOptionActive,
                    ]}
                    onPress={() => changeCurrency(curr)}
                  >
                    <Text
                      style={[
                        styles.currencyOptionText,
                        currency?.code === curr.code && styles.currencyOptionTextActive,
                      ]}
                    >
                      {curr.code}
                    </Text>
                    <Text style={styles.currencySymbol}>{curr.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActionsSection}>
              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalResetButton]}
                onPress={onResetGoals}
                disabled={isResettingGoals}
              >
                <Ionicons name="refresh-outline" size={rs(18)} color="#FF6B6B" />
                <Text style={styles.modalResetButtonText}>
                  {isResettingGoals ? (t('common.loading') || 'Loading...') : (t('profile.resetGoals') || 'Reset All Goals')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionButton, styles.modalLogoutButton]}
                onPress={onLogout}
              >
                <Ionicons name="log-out-outline" size={rs(18)} color="#18133E" />
                <Text style={styles.modalLogoutButtonText}>{t('auth.logout') || 'Logout'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  contentContainer: {
    paddingBottom: rs(96),
    flexGrow: 1,
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: rs(30),
    fontWeight: '700',
    color: '#101033',
  },
  profileButton: {
    paddingHorizontal: rs(8),
    paddingVertical: rs(6),
    borderRadius: rs(12),
    backgroundColor: 'rgba(47, 138, 193, 0.08)',
  },
  profileButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  profileTextContainer: {
    maxWidth: rs(100),
  },
  profileButtonUsername: {
    fontSize: rs(14),
    fontWeight: '600',
    color: '#18133E',
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
    width: rs(86),
  },
  kpiCircleWrap: {
    width: rs(64),
    height: rs(64),
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiImageWrap: {
    position: 'absolute',
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
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
  goalSuggestionLabel: {
    fontSize: rs(10),
    color: '#2F8AC1',
    fontWeight: '600',
    marginBottom: rs(2),
    textTransform: 'uppercase',
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
  // Modal Styles
  modalFullScreen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingTop: rs(46),
    paddingBottom: rs(12),
    backgroundColor: '#F5F6FA',
  },
  modalTitle: {
    fontSize: rs(20),
    fontWeight: '700',
    color: '#18133E',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(28),
    paddingTop: rs(8),
    flexGrow: 1,
  },
  modalUserSection: {
    alignItems: 'center',
    paddingVertical: rs(20),
    backgroundColor: '#FFFFFF',
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: '#E8E8EF',
  },
  modalAvatar: {
    width: rs(84),
    height: rs(84),
    borderRadius: rs(42),
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalUsername: {
    fontSize: rs(22),
    fontWeight: '700',
    color: '#18133E',
    marginBottom: rs(4),
  },
  modalEmail: {
    fontSize: rs(14),
    color: '#8A8A94',
    marginBottom: rs(16),
  },
  modalStatsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: rs(16),
    borderTopWidth: 1,
    borderTopColor: '#EEF0F5',
  },
  modalStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalStatValue: {
    fontSize: rs(18),
    fontWeight: '700',
    color: '#2F8AC1',
  },
  modalStatLabel: {
    fontSize: rs(12),
    color: '#8A8A94',
    marginTop: rs(4),
  },
  modalStatDivider: {
    width: 1,
    height: rs(30),
    backgroundColor: '#EEF0F5',
  },
  modalSuggestionsSection: {
    marginTop: rs(16),
    padding: rs(16),
    backgroundColor: '#FFFFFF',
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: '#E8E8EF',
  },
  modalSectionTitle: {
    fontSize: rs(16),
    fontWeight: '700',
    color: '#18133E',
    marginBottom: rs(12),
  },
  languageButtonsContainer: {
    flexDirection: 'row',
    gap: rs(10),
    marginBottom: rs(16),
  },
  currencyLanguageButton: {
    flex: 1,
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
    borderRadius: rs(10),
    backgroundColor: '#F2F3F7',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyLanguageButtonActive: {
    backgroundColor: '#2F8AC1',
    borderColor: '#2F8AC1',
  },
  currencyLanguageButtonText: {
    fontSize: rs(14),
    fontWeight: '600',
    color: '#1D1D1D',
  },
  currencyLanguageButtonTextActive: {
    color: '#FFF',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
    marginBottom: rs(16),
  },
  currencyOption: {
    width: '31%',
    paddingVertical: rs(10),
    paddingHorizontal: rs(8),
    borderRadius: rs(10),
    backgroundColor: '#F2F3F7',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8EF',
  },
  currencyOptionActive: {
    backgroundColor: '#2F8AC1',
    borderColor: '#2F8AC1',
  },
  currencyOptionText: {
    fontSize: rs(12),
    fontWeight: '600',
    color: '#1D1D1D',
  },
  currencyOptionTextActive: {
    color: '#FFF',
  },
  currencySymbol: {
    fontSize: rs(10),
    color: '#8A8A94',
    marginTop: rs(2),
  },
  modalActionsSection: {
    gap: rs(10),
    marginTop: rs(16),
    padding: rs(16),
    backgroundColor: '#FFFFFF',
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: '#E8E8EF',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(13),
    paddingHorizontal: rs(16),
    borderRadius: rs(12),
    gap: rs(8),
  },
  modalResetButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },
  modalResetButtonText: {
    fontSize: rs(14),
    fontWeight: '600',
    color: '#D64545',
  },
  modalLogoutButton: {
    backgroundColor: '#EEF6FC',
    borderWidth: 1,
    borderColor: '#B9D8F0',
  },
  modalLogoutButtonText: {
    fontSize: rs(14),
    fontWeight: '600',
    color: '#18133E',
  },
});
