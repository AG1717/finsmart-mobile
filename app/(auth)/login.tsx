import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../src/store/authStore';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { COLORS } from '../../src/utils/constants';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

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
    const nextErrors: { email?: string; password?: string } = {};

    if (!email) {
      nextErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextErrors.email = t('errors.invalidEmail');
    }

    if (!password) {
      nextErrors.password = t('errors.required');
    }

    setErrors(nextErrors);
    return nextErrors;
  };

  const handleLogin = async () => {
    console.log('[Auth][Login] Button pressed');
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      const message = Object.values(nextErrors).filter(Boolean).join('\n') || t('errors.invalidCredentials');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(message);
      } else {
        Alert.alert(t('common.error'), message);
      }
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Login] Sending request...');
      await login(email, password);
      console.log('[Auth][Login] Success');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { data?: { error?: { message?: string } } };
      };

      let errorMessage = t('errors.invalidCredentials');

      if (typedError.code === 'ECONNABORTED') {
        errorMessage = 'Connection timeout. The server may be waking up, please retry.';
      } else if (typedError.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Check your internet connection.';
      } else if (typedError.response?.data?.error?.message) {
        errorMessage = typedError.response.data.error.message;
      } else if (typedError.message) {
        errorMessage = typedError.message;
      }

      console.error('[Auth][Login] Error:', error);
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
          <Text style={styles.title}>{t('auth.login')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcome')}</Text>
        </View>

        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            required
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            required
          />

          <View style={styles.buttonContainer}>
            <Button
              title={t('auth.loginButton')}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />
            <Button
              title={t('auth.signup')}
              onPress={() => {
                blurActiveElement();
                router.push('/(auth)/register');
              }}
              variant="outline"
              style={styles.signupButton}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => {
              blurActiveElement();
              router.push('/(auth)/forgot-password' as any);
            }}
          >
            <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
            <Text
              style={styles.link}
              onPress={() => {
                blurActiveElement();
                router.push('/(auth)/register');
              }}
            >
              {t('auth.signup')}
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  loginButton: {
    flex: 1,
  },
  signupButton: {
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
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
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
