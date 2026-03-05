import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, BackHandler, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  const blurActiveElement = () => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    if (active && typeof active.blur === 'function') active.blur();
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => backHandler.remove();
  }, []);

  const goToRegister = () => {
    blurActiveElement();
    router.push('/(auth)/register');
  };

  const goToLogin = () => {
    blurActiveElement();
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image source={require('../../assets/logo_new.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.appName}>FinSmart</Text>
      </View>

      <View style={styles.bottomCurve}>
        <Text style={styles.tagline}>Reach financial goals{'\n'}Smarter and Faster</Text>

        <Pressable
          style={({ pressed }) => [styles.button, styles.outlineButton, pressed && styles.pressed]}
          onPress={goToRegister}
        >
          <Text style={styles.outlineButtonText}>Sign Up</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.button, styles.solidButton, pressed && styles.pressed]}
          onPress={goToLogin}
        >
          <Text style={styles.solidButtonText}>Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  topSection: {
    flex: 0.46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
  },
  logoImage: {
    width: 128,
    height: 98,
    marginBottom: 8,
  },
  appName: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2F8AC1',
    letterSpacing: 0.4,
  },
  bottomCurve: {
    flex: 0.54,
    backgroundColor: '#2F8AC1',
    borderTopLeftRadius: 240,
    borderTopRightRadius: 240,
    paddingHorizontal: 26,
    paddingTop: 86,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 47,
    fontWeight: '700',
    lineHeight: 58,
    textAlign: 'center',
    marginBottom: 52,
  },
  button: {
    borderRadius: 14,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  solidButton: {
    backgroundColor: '#FFFFFF',
  },
  outlineButtonText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '600',
  },
  solidButtonText: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
