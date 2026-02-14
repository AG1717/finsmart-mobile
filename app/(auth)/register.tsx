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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Username: alphanumérique uniquement, 3-30 caractères
    if (!formData.username) {
      newErrors.username = t('errors.required');
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 30) {
      newErrors.username = 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters and numbers (no spaces or special characters)';
    }

    // Email
    if (!formData.email) {
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    // Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
    if (!formData.password) {
      newErrors.password = t('errors.required');
    } else if (formData.password.length < 8) {
      newErrors.password = t('errors.passwordTooShort');
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('errors.passwordRequirements');
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      console.log('❌ Validation errors:', newErrors);
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    console.log('📝 Registration attempt with data:', {
      username: formData.username,
      email: formData.email,
      passwordLength: formData.password.length,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    try {
      setLoading(true);
      await register(formData);
      console.log('✅ Registration successful');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('❌ Registration error:', {
        message: error.message,
        response: error.response?.data,
        code: error.code,
        status: error.response?.status,
      });

      let errorMessage = 'Registration failed';

      // Extraire le message d'erreur spécifique
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Erreur réseau. Vérifiez que le backend est accessible.';
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        errorMessage = 'Délai d\'attente dépassé. Le serveur ne répond pas.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Afficher l'erreur avec plus de détails
      const fullMessage = `${errorMessage}\n\nVérifiez la console pour plus de détails.`;

      if (Platform.OS === 'web') {
        window.alert(fullMessage);
      } else {
        Alert.alert(t('common.error'), fullMessage);
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
        {/* GROS bouton retour visible - backup au cas où le header natif ne marche pas */}
        <Pressable
          style={styles.bigBackButton}
          onPress={() => router.back()}
        >
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
            style={{ marginTop: 8 }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
            <Text
              style={styles.link}
              onPress={() => router.push('/(auth)/login')}
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
    paddingBottom: 24,
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
