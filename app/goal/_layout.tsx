import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/constants';

export default function GoalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.white },
        headerTitleStyle: { color: COLORS.gray[900], fontWeight: '600' },
        headerTintColor: COLORS.primary,
      }}
    >
      <Stack.Screen name="create" options={{ title: 'New Goal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Goal Details' }} />
    </Stack>
  );
}
