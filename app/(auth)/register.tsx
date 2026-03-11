import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform, Image, ScrollView, Dimensions, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const { width, height } = Dimensions.get('window');
const uiScale = Math.max(0.78, Math.min(Math.min(width / 390, height / 844), 1.15));
const rs = (value: number) => Math.round(value * uiScale);

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
  const [showPassword, setShowPassword] = useState(false);

  const showMessage = (message: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(message);
    } else {
      Alert.alert('Error', message);
    }
  };

  const handleRegister = async () => {
    console.log('[Auth][Register] Button pressed');

    const normalizedUsername = formData.username.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !formData.password) {
      showMessage('Username, email and password are required.');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(normalizedUsername)) {
      showMessage('Username can only contain letters and numbers.');
      return;
    }

    if (normalizedUsername.length < 3 || normalizedUsername.length > 30) {
      showMessage('Username must be between 3 and 30 characters.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      showMessage('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 8 || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      showMessage('Password must have 8+ chars, one uppercase, one lowercase, and one number.');
      return;
    }

    try {
      setLoading(true);
      console.log('[Auth][Register] Sending request...');
      await register({
        ...formData,
        username: normalizedUsername,
        email: normalizedEmail,
      });
      router.replace('/(tabs)');
    } catch (error: unknown) {
      const typedError = error as {
        code?: string;
        message?: string;
        response?: { status?: number; data?: { error?: { message?: string; details?: Array<{ field?: string; message?: string }> } } };
      };

      let message = 'Registration failed';
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

      console.error('[Auth][Register] Error:', error);
      console.error('[Auth][Register] Status:', typedError.response?.status);
      console.error('[Auth][Register] Response:', typedError.response?.data);
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

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#A9A9B3"
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
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
    fontSize: rs(32),
    fontWeight: '700',
    color: '#2F8AC1',
  },
  title: {
    textAlign: 'center',
    fontSize: rs(27),
    fontWeight: '700',
    color: '#2F8AC1',
    marginBottom: rs(28),
  },
  form: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: rs(16),
  },
  input: {
    height: rs(50),
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
    height: rs(50),
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
    height: rs(50),
    justifyContent: 'center',
    paddingHorizontal: rs(8),
  },
  registerButton: {
    marginTop: rs(8),
    alignSelf: 'center',
    width: Math.min(width - rs(52), rs(290)),
    height: rs(52),
    borderRadius: 14,
    backgroundColor: '#2F8AC1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: rs(20),
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.86,
  },
});
