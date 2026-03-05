import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, BackHandler, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const uiScale = Math.max(0.78, Math.min(Math.min(width / 390, height / 844), 1.2));
const rs = (value: number) => Math.round(value * uiScale);

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
    paddingTop: rs(22),
  },
  logoImage: {
    width: rs(128),
    height: rs(98),
    marginBottom: rs(8),
  },
  appName: {
    fontSize: rs(42),
    fontWeight: '700',
    color: '#2F8AC1',
    letterSpacing: 0.4,
  },
  bottomCurve: {
    flex: 0.54,
    backgroundColor: '#2F8AC1',
    borderTopLeftRadius: rs(180),
    borderTopRightRadius: rs(180),
    paddingHorizontal: rs(26),
    paddingTop: rs(72),
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: rs(34),
    fontWeight: '700',
    lineHeight: rs(42),
    textAlign: 'center',
    marginBottom: rs(40),
  },
  button: {
    borderRadius: rs(14),
    height: rs(54),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(12),
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
    fontSize: rs(22),
    fontWeight: '600',
  },
  solidButtonText: {
    color: '#111111',
    fontSize: rs(22),
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
