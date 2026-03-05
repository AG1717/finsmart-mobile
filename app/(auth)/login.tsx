import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

const { width, height } = Dimensions.get('window');
const uiScale = Math.max(0.78, Math.min(Math.min(width / 390, height / 844), 1.15));
const rs = (value: number) => Math.round(value * uiScale);

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleLogin = async () => {
    console.log('[Auth][Login] Button pressed');

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
        response?: { data?: { error?: { message?: string; details?: Array<{ field?: string; message?: string }> } } };
      };

      let message = 'Login failed';
      if (typedError.code === 'ECONNABORTED') {
        message = 'Server timeout. Render may be waking up, retry in 30-60s.';
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
      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.logoWrap}>
        <Image source={require('../../assets/logo_new.png')} style={styles.logoImage} resizeMode="contain" />
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

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#A9A9B3"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.loginButtonText}>{loading ? 'Loading...' : 'Login'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: rs(20),
    paddingTop: rs(42),
  },
  backButton: {
    width: rs(34),
    height: rs(34),
    justifyContent: 'center',
  },
  backText: {
    fontSize: rs(24),
    color: '#12122E',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: rs(6),
    marginBottom: rs(24),
  },
  logoImage: {
    width: rs(112),
    height: rs(86),
  },
  appName: {
    marginTop: rs(4),
    fontSize: rs(34),
    fontWeight: '700',
    color: '#2F8AC1',
  },
  title: {
    textAlign: 'center',
    fontSize: rs(30),
    fontWeight: '700',
    color: '#2F8AC1',
    marginBottom: rs(18),
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: rs(12),
  },
  input: {
    height: rs(52),
    borderWidth: 2,
    borderColor: '#2F8AC1',
    borderRadius: 8,
    paddingHorizontal: rs(14),
    fontSize: rs(18),
    color: '#12122E',
    backgroundColor: '#F2F2F2',
  },
  loginButton: {
    marginTop: rs(8),
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
});
