import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, Image, Dimensions, ScrollView, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { API_BASE_URL } from '../../src/services/api/client';

const { width, height } = Dimensions.get('window');
const uiScale = Math.max(0.78, Math.min(Math.min(width / 390, height / 844), 1.15));
const rs = (value: number) => Math.round(value * uiScale);

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleLogin = async () => {
    console.log('[Auth][Login] Button pressed');
    if (loading) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      showMessage('Please fill email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      showMessage('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Login] Sending request...');
      await login(normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { status?: number; data?: { error?: { message?: string; details?: Array<{ field?: string; message?: string }> } } };
      };

      let message = 'Login failed';
      if (typedError.code === 'ECONNABORTED') {
        message = `Server timeout. API may be down or cold-starting. Endpoint: ${API_BASE_URL}`;
      } else if (typedError.code === 'ERR_NETWORK') {
        message = 'Network error. Check internet/CORS/backend status.';
      } else if (typedError.response?.data?.error?.details?.length) {
        message = typedError.response.data.error.details[0].message || message;
      } else if (typedError.response?.data?.error?.message) {
        message = typedError.response.data.error.message;
      } else if (typedError.message) {
        message = typedError.message;
      }

      console.error('[Auth][Login] Error:', error);
      console.error('[Auth][Login] Status:', typedError.response?.status);
      console.error('[Auth][Login] Response:', typedError.response?.data);
      console.error('[Auth][Login] API Base URL:', API_BASE_URL);
      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/logo_new.png')} style={styles.logoImage} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>FinSmart</Text>
        </View>

        <Text style={styles.title}>Account</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A9A9B3"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#A9A9B3"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                size={24} 
                color="#2F8AC1" 
              />
            </TouchableOpacity>
          </View>

          <Pressable style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginButtonText}>{loading ? 'Loading...' : 'Login'}</Text>
          </Pressable>

          <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>Vous n'avez pas encore de compte? </Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.signupLink}>S'inscrire</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: rs(20),
    paddingTop: rs(42),
    paddingBottom: rs(24),
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: rs(-40),
    marginBottom: rs(32),
  },
  logoContainer: {
    width: rs(333),
    height: rs(256),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(-16),
    borderRadius: rs(12),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    marginTop: rs(-8),
    fontSize: rs(34),
    fontWeight: '700',
    color: '#2F8AC1',
  },
  title: {
    textAlign: 'center',
    fontSize: rs(30),
    fontWeight: '700',
    color: '#2F8AC1',
    marginBottom: rs(32),
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: rs(20),
  },
  input: {
    height: rs(52),
    borderWidth: 2,
    borderColor: '#2F8AC1',
    borderRadius: 8,
    paddingHorizontal: rs(14),
    fontSize: rs(18),
    color: '#12122E',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    height: rs(52),
    borderWidth: 2,
    borderColor: '#2F8AC1',
    borderRadius: 8,
    paddingHorizontal: rs(14),
    paddingRight: rs(50),
    fontSize: rs(18),
    color: '#12122E',
    backgroundColor: '#FFFFFF',
  },
  eyeButton: {
    position: 'absolute',
    right: rs(12),
    height: rs(52),
    justifyContent: 'center',
    paddingHorizontal: rs(8),
  },
  loginButton: {
    marginTop: rs(12),
    alignSelf: 'center',
    width: Math.min(width - rs(52), rs(290)),
    height: rs(54),
    borderRadius: 14,
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: rs(20),
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
  signupPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: rs(12),
    gap: rs(4),
  },
  signupText: {
    fontSize: rs(16),
    color: '#666',
    fontWeight: '400',
  },
  signupLink: {
    fontSize: rs(16),
    color: '#2F8AC1',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
