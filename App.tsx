import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Compatibility fallback.
 * The app now uses Expo Router as the real entrypoint via package.json main.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>FinSmart is running via Expo Router.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
  },
});
