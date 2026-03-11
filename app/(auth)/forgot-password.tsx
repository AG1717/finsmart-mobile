import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { COLORS } from '../../src/utils/constants';
import { authApi } from '../../src/services/api/authApi';
import { ModalAlert } from '../../src/components/common/ModalAlert';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [devCode, setDevCode] = useState<string | null>(null);
  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: '',
    variant: 'info' as const,
  });

  const closeModal = () => setModal((prev) => ({ ...prev, visible: false }));

  const showAlert = (title: string, message: string) => {
    setModal({
      visible: true,
      title,
      message,
      variant: title === t('common.error') ? 'error' : 'success',
    });
  };

  const handleSendCode = async () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('errors.invalidEmail');
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      const result = await authApi.forgotPassword(email);
      // In dev mode, the API returns the reset code
      if (result.resetCode) {
        setDevCode(result.resetCode);
      }
      showAlert(t('common.success'), t('auth.codeSent'));
      setStep('reset');
    } catch (error: any) {
      let msg = t('errors.serverError');
      if (error.response?.data?.error?.message) {
        msg = error.response.data.error.message;
      }
      showAlert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const newErrors: Record<string, string> = {};
    if (!code) newErrors.code = t('errors.required');
    if (!newPassword) {
      newErrors.newPassword = t('errors.required');
    } else if (newPassword.length < 8) {
      newErrors.newPassword = t('errors.passwordTooShort');
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = t('errors.required');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNoMatch');
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      await authApi.resetPassword(email, code, newPassword);
      showAlert(t('common.success'), t('auth.passwordResetSuccess'));
      router.replace('/(auth)/login');
    } catch (error: any) {
      let msg = t('errors.serverError');
      if (error.response?.data?.error?.message) {
        msg = error.response.data.error.message;
      }
      showAlert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ModalAlert
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onClose={closeModal}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgotPasswordDesc')}</Text>
        </View>

        <View style={styles.form}>
          {step === 'email' ? (
            <>
              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                required
              />
              <Button
                title={t('auth.sendCode')}
                onPress={handleSendCode}
                loading={loading}
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              {/* Show dev code hint in development */}
              {devCode && (
                <View style={styles.devCodeBox}>
                  <Text style={styles.devCodeLabel}>Code (dev mode):</Text>
                  <Text style={styles.devCodeValue}>{devCode}</Text>
                </View>
              )}

              <Input
                label={t('auth.resetCode')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                error={errors.code}
                required
              />
              <Input
                label={t('auth.newPasswordLabel')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                error={errors.newPassword}
                required
              />
              <Input
                label={t('auth.confirmPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={errors.confirmPassword}
                required
              />
              <Button
                title={t('auth.resetPassword')}
                onPress={handleResetPassword}
                loading={loading}
                style={styles.submitButton}
              />

              <TouchableOpacity style={styles.resendButton} onPress={() => { setStep('email'); setCode(''); setDevCode(null); }}>
                <Text style={styles.link}>{t('auth.sendCode')}</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
  },
  link: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  devCodeBox: {
    backgroundColor: '#FFF9C4',
    borderWidth: 1,
    borderColor: '#FBC02D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devCodeLabel: {
    fontSize: 13,
    color: COLORS.gray[700],
    fontWeight: '600',
  },
  devCodeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E65100',
    letterSpacing: 2,
  },
});
