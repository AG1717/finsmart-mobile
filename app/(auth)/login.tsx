import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

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

    if (!email || !password) {
      showMessage('Please fill email and password.');
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Login] Sending request...');
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { data?: { error?: { message?: string } } };
      };

      let message = 'Login failed';
      if (typedError.code === 'ECONNABORTED') {
        message = 'Server timeout. Render may be waking up, retry in 30-60s.';
      } else if (typedError.code === 'ERR_NETWORK') {
        message = 'Network error. Check internet/CORS/backend status.';
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
          placeholder="Username, Email"
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
    paddingHorizontal: 24,
    paddingTop: 56,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#12122E',
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  logoImage: {
    width: 140,
    height: 108,
  },
  appName: {
    marginTop: 4,
    fontSize: 48,
    fontWeight: '700',
    color: '#2F8AC1',
  },
  title: {
    textAlign: 'center',
    fontSize: 42,
    fontWeight: '700',
    color: '#2F8AC1',
    marginBottom: 26,
  },
  form: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 18,
  },
  input: {
    height: 62,
    borderWidth: 2,
    borderColor: '#2F8AC1',
    borderRadius: 8,
    paddingHorizontal: 18,
    fontSize: 31,
    color: '#12122E',
    backgroundColor: '#F2F2F2',
  },
  loginButton: {
    marginTop: 10,
    alignSelf: 'center',
    width: 290,
    height: 62,
    borderRadius: 14,
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
});
