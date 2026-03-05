import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { COLORS } from '../../src/utils/constants';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const register = useAuthStore((state) => state.register);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const blurActiveElement = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.username) {
      nextErrors.username = t('errors.required');
    } else if (formData.username.length < 3) {
      nextErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      nextErrors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      nextErrors.username = 'Username can only contain letters and numbers';
    }

    if (!formData.email) {
      nextErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = t('errors.invalidEmail');
    }

    if (!formData.password) {
      nextErrors.password = t('errors.required');
    } else if (formData.password.length < 8) {
      nextErrors.password = t('errors.passwordTooShort');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      nextErrors.password = t('errors.passwordRequirements');
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleRegister = async () => {
    console.log('[Auth][Register] Button pressed');
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      const message = Object.values(nextErrors).join('\n');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message);
      } else {
        Alert.alert(t('common.error'), message);
      }
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Register] Sending request...');
      await register(formData);
      console.log('[Auth][Register] Success');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { data?: { error?: { message?: string } } };
      };

      let errorMessage = 'Registration failed';
      if (typedError.response?.data?.error?.message) {
        errorMessage = typedError.response.data.error.message;
      } else if (typedError.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Check backend availability.';
      } else if (typedError.code === 'ECONNABORTED' || typedError.code === 'ETIMEDOUT') {
        errorMessage = 'Request timeout. The server did not respond in time.';
      } else if (typedError.message) {
        errorMessage = typedError.message;
      }

      console.error('[Auth][Register] Error:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(errorMessage);
      } else {
        Alert.alert(t('common.error'), errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Pressable style={styles.bigBackButton} onPress={() => router.back()}>
          <Text style={styles.bigBackArrow}>←</Text>
          <Text style={styles.bigBackText}>RETOUR</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.signup')}</Text>
          <Text style={styles.subtitle}>Create your FinSmart account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.username')}
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
            autoCapitalize="none"
            error={errors.username}
            required
          />

          <Input
            label={t('auth.email')}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            required
          />

          <Input
            label={t('auth.password')}
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            error={errors.password}
            required
          />

          <Input
            label={t('auth.firstName')}
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
          />

          <Input
            label={t('auth.lastName')}
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
          />

          <Button
            title={t('auth.signupButton')}
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={{ marginTop: 24 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
            <Text
              style={styles.link}
              onPress={() => {
                blurActiveElement();
                router.push('/(auth)/login');
              }}
            >
              {t('auth.login')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  form: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  link: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  bigBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  bigBackArrow: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 8,
  },
  bigBackText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
