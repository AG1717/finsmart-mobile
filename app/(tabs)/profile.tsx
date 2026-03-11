import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../src/store/authStore';
import { saveLanguage } from '../../src/utils/i18n';
import { COLORS } from '../../src/utils/constants';
import { Button } from '../../src/components/common/Button';
import { goalsApi } from '../../src/services/api/goalsApi';
import { ModalAlert } from '../../src/components/common/ModalAlert';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [isResettingGoals, setIsResettingGoals] = useState(false);
  const [alertModal, setAlertModal] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'info' as const,
    primaryLabel: 'OK',
    secondaryLabel: undefined as undefined | string,
    onPrimary: undefined as undefined | (() => void),
    onSecondary: undefined as undefined | (() => void),
  });

  const closeAlert = () => setAlertModal((prev) => ({ ...prev, visible: false }));
  const showAlert = (title: string, message: string, variant: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({
      visible: true,
      title,
      message,
      variant,
      primaryLabel: t('common.confirm'),
      secondaryLabel: undefined,
      onPrimary: closeAlert,
      onSecondary: undefined,
    });
  };
  const confirmAlert = (title: string, message: string, onConfirm: () => void) => {
    setAlertModal({
      visible: true,
      title,
      message,
      variant: 'warning',
      primaryLabel: t('common.confirm'),
      secondaryLabel: t('common.cancel'),
      onPrimary: () => {
        closeAlert();
        onConfirm();
      },
      onSecondary: closeAlert,
    });
  };

  const displayName =
    user?.username?.trim() ||
    user?.profile?.firstName?.trim() ||
    user?.email?.split('@')[0] ||
    'Utilisateur';
  const avatarUrl = user?.profile?.avatar?.trim() || '';

  const handleLogout = () => {
    confirmAlert(
      t('auth.logout'),
      'Are you sure you want to logout?',
      async () => {
        await logout();
        router.replace('/(auth)/welcome');
      }
    );
  };

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
              activeGoals: 0,
              totalGoals: 0,
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
            recentGoals: [],
            nearCompletion: [],
          };
        });
        queryClient.setQueryData(['goals', 'dashboard-list'], (prev: any) => {
          if (!prev?.goals) return prev;
          return {
            ...prev,
            goals: [],
            pagination: {
              ...prev.pagination,
              total: 0,
              pages: 0,
            },
          };
        });
        queryClient.setQueryData(['goals'], (prev: any) => {
          if (!prev?.goals) return prev;
          return {
            ...prev,
            goals: [],
            pagination: {
              ...prev.pagination,
              total: 0,
              pages: 0,
            },
          };
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
        ]);
        showAlert(t('common.success'), t('profile.resetGoalsSuccess'), 'success');
      } catch (error: any) {
        const status = error?.response?.status;
        const serverMessage =
          error?.response?.data?.error?.message ||
          error?.response?.data?.message;
        const errorText = serverMessage
          ? `${serverMessage}${status ? ` (HTTP ${status})` : ''}`
          : `${t('profile.resetGoalsError')}${status ? ` (HTTP ${status})` : ''}`;
        showAlert(t('common.error'), errorText, 'error');
      } finally {
        setIsResettingGoals(false);
      }
    };

    confirmAlert(
      t('profile.resetGoalsConfirmTitle'),
      t('profile.resetGoalsConfirmBody'),
      confirmReset
    );
  };

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <ModalAlert
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        primaryLabel={alertModal.primaryLabel}
        secondaryLabel={alertModal.secondaryLabel}
        onPrimary={alertModal.onPrimary}
        onSecondary={alertModal.onSecondary}
        onClose={closeAlert}
      />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#18133E" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <View style={styles.spacerHeader} />
        </View>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color={COLORS.white} />
            )}
          </View>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="language" size={24} color={COLORS.gray[600]} />
            <Text style={styles.settingLabel}>{t('profile.language')}</Text>
          </View>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === 'fr' && styles.languageButtonActive,
              ]}
              onPress={() => changeLanguage('fr')}
            >
              <Text
                style={[
                  styles.languageText,
                  i18n.language === 'fr' && styles.languageTextActive,
                ]}
              >
                FR
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageButton,
                i18n.language === 'en' && styles.languageButtonActive,
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text
                style={[
                  styles.languageText,
                  i18n.language === 'en' && styles.languageTextActive,
                ]}
              >
                EN
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="cash" size={24} color={COLORS.gray[600]} />
            <Text style={styles.settingLabel}>{t('profile.currency')}</Text>
          </View>
          <Text style={styles.settingValue}>
            {user?.preferences.currency?.code || 'USD'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <Button
          title={t('auth.logout')}
          onPress={handleLogout}
          variant="danger"
          fullWidth
        />
        <Button
          title={t('profile.resetGoals')}
          onPress={handleResetGoals}
          variant="outline"
          fullWidth
          loading={isResettingGoals}
          style={styles.resetButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  contentContainer: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 46,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#101033',
    flex: 1,
    textAlign: 'center',
  },
  spacerHeader: {
    width: 40,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: COLORS.gray[900],
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  languageButtons: {
    flexDirection: 'row',
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    marginLeft: 8,
  },
  languageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[600],
  },
  languageTextActive: {
    color: COLORS.white,
  },
  resetButton: {
    marginTop: 12,
  },
});
