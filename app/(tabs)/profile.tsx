import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { saveLanguage } from '../../src/utils/i18n';
import { COLORS } from '../../src/utils/constants';
import { Button } from '../../src/components/common/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        logout().then(() => router.replace('/(auth)/welcome'));
      }
    } else {
      Alert.alert(
        t('auth.logout'),
        'Are you sure you want to logout?',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('auth.logout'),
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

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await saveLanguage(lang);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      {/* User Info */}
      <View style={styles.section}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username}</Text>
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
    paddingBottom: 100,
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
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
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
});
