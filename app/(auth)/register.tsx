import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleRegister = async () => {
    console.log('[Auth][Register] Button pressed');

    if (!formData.username || !formData.email || !formData.password) {
      showMessage('Username, email and password are required.');
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Register] Sending request...');
      await register(formData);
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { data?: { error?: { message?: string } } };
      };

      let message = 'Registration failed';
      if (typedError.code === 'ECONNABORTED') {
        message = 'Server timeout. Render may be waking up, retry in 30-60s.';
      } else if (typedError.code === 'ERR_NETWORK') {
        message = 'Network error. Check internet/CORS/backend status.';
      } else if (typedError.response?.data?.error?.message) {
        message = typedError.response.data.error.message;
      } else if (typedError.message) {
        message = typedError.message;
      }

      console.error('[Auth][Register] Error:', error);
      showMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </Pressable>

      <View style={styles.logoWrap}>
        <Image source={require('../../assets/logo_new.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.appName}>FinSmart</Text>
      </View>

      <Text style={styles.title}>Create account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#A9A9B3"
          value={formData.username}
          onChangeText={(v) => setFormData({ ...formData, username: v })}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#A9A9B3"
          value={formData.email}
          onChangeText={(v) => setFormData({ ...formData, email: v })}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#A9A9B3"
          value={formData.password}
          onChangeText={(v) => setFormData({ ...formData, password: v })}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="First name (optional)"
          placeholderTextColor="#A9A9B3"
          value={formData.firstName}
          onChangeText={(v) => setFormData({ ...formData, firstName: v })}
        />

        <TextInput
          style={styles.input}
          placeholder="Last name (optional)"
          placeholderTextColor="#A9A9B3"
          value={formData.lastName}
          onChangeText={(v) => setFormData({ ...formData, lastName: v })}
        />

        <Pressable style={({ pressed }) => [styles.registerButton, pressed && styles.pressed]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.registerButtonText}>{loading ? 'Loading...' : 'Sign Up'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%' as any,
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
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
    marginBottom: 26,
  },
  logoImage: {
    width: 132,
    height: 96,
  },
  appName: {
    marginTop: 4,
    fontSize: 44,
    fontWeight: '700',
    color: '#2F8AC1',
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: '#2F8AC1',
    marginBottom: 18,
  },
  form: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    gap: 14,
  },
  input: {
    height: 58,
    borderWidth: 2,
    borderColor: '#2F8AC1',
    borderRadius: 8,
    paddingHorizontal: 18,
    fontSize: 26,
    color: '#12122E',
    backgroundColor: '#F2F2F2',
  },
  registerButton: {
    marginTop: 8,
    alignSelf: 'center',
    width: 290,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
});
