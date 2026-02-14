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

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('errors.required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('errors.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('errors.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    console.log('🔵 handleLogin called - email:', email, 'password length:', password?.length);

    if (!validate()) {
      console.log('❌ Validation failed');
      // Afficher une alerte si la validation échoue
      const validationErrors = [];
      if (!email) validationErrors.push('Email requis');
      else if (!/\S+@\S+\.\S+/.test(email)) validationErrors.push('Email invalide');
      if (!password) validationErrors.push('Mot de passe requis');

      const errorMsg = validationErrors.join(', ');
      if (Platform.OS === 'web') {
        window.alert('Erreur de validation: ' + errorMsg);
      } else {
        Alert.alert('Erreur de validation', errorMsg);
      }
      return;
    }

    console.log('✅ Validation passed, calling login API...');

    try {
      setLoading(true);
      console.log('🔄 Calling login function...');
      await login(email, password);
      console.log('✅ Login successful, redirecting...');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('❌ Login error:', error);
      let errorMessage = t('errors.invalidCredentials');

      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Connexion lente. Le serveur se réveille, réessayez dans 30 secondes.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Erreur réseau. Vérifiez votre connexion internet.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Erreur inconnue: ' + JSON.stringify(error);
      }

      console.log('🚨 Showing error alert:', errorMessage);

      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert(t('common.error'), errorMessage);
      }
    } finally {
      setLoading(false);
      console.log('🔵 Login process finished');
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
              onPress={() => router.push('/(auth)/register')}
              variant="outline"
              style={styles.signupButton}
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/(auth)/forgot-password' as any)}>
            <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.dontHaveAccount')} </Text>
            <Text
              style={styles.link}
              onPress={() => router.push('/(auth)/register')}
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
    paddingBottom: 80, // Plus d'espace en bas pour éviter les boutons du téléphone
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
    marginTop: 24, // Plus d'espace au-dessus des boutons
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
