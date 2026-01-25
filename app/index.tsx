import { Redirect } from 'expo-router';

export default function Index() {
  // Toujours rediriger vers welcome pour l'instant
  return <Redirect href="/(auth)/welcome" />;
}
