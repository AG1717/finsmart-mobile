import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: true,
          title: 'Mot de passe oubli\u00e9',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#3B82F6',
          headerTitleStyle: { fontWeight: '600', color: '#1F2937' },
        }}
      />
    </Stack>
  );
}
