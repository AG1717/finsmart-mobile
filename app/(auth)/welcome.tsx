import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, BackHandler, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  const blurActiveElement = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') {
      active.blur();
    }
  };

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !window.history ||
      typeof window.history.pushState !== 'function'
    ) {
      return;
    }

    const blockBack = () => window.history.go(1);
    window.history.pushState(null, document.title, window.location.href);
    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, []);

  const handleSignUp = () => {
    blurActiveElement();
    router.push('/(auth)/register');
  };

  const handleLogin = () => {
    blurActiveElement();
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo_new.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.appName}>FinSmart</Text>
        </View>

        <Text style={styles.tagline}>Reach financial goals Smarter and Faster</Text>

        <View style={styles.buttonsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.primaryButton,
              pressed && styles.buttonPressed,
              Platform.OS === 'web' && styles.webButton,
            ]}
            onPress={handleSignUp}
          >
            <Text style={styles.primaryButtonText}>Sign Up</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.outlineButton,
              pressed && styles.outlineButtonPressed,
              Platform.OS === 'web' && styles.webButton,
            ]}
            onPress={handleLogin}
          >
            <Text style={styles.outlineButtonText}>Login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 140,
    height: 110,
    marginBottom: 12,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  tagline: {
    fontSize: 18,
    textAlign: 'center',
    color: '#6B7280',
    marginBottom: 64,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  outlineButtonText: {
    color: '#4F46E5',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.8,
    backgroundColor: '#4338CA',
  },
  outlineButtonPressed: {
    opacity: 0.8,
    backgroundColor: '#EEF2FF',
  },
  webButton: {
    cursor: 'pointer',
  } as any,
});
