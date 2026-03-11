import { Tabs, usePathname, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, BackHandler, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { COLORS } from '../../src/utils/constants';
import { useAuthStore } from '../../src/store/authStore';

export default function TabsLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const appState = useRef(AppState.currentState);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Historique des tabs visitées
  const [tabHistory, setTabHistory] = useState<string[]>(['/']);
  const tabHistoryRef = useRef<string[]>(['/']);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Mettre à jour la ref quand l'historique change
  useEffect(() => {
    tabHistoryRef.current = tabHistory;
  }, [tabHistory]);

  // Ajouter la tab actuelle à l'historique
  useEffect(() => {
    if (pathname && !pathname.includes('auth')) {
      setTabHistory(prev => {
        if (prev[prev.length - 1] === pathname) return prev;
        const newHistory = [...prev, pathname];
        tabHistoryRef.current = newHistory;
        return newHistory;
      });
    }
  }, [pathname]);

  // Fonction pour revenir en arrière dans les tabs
  const goBack = useCallback(() => {
    const history = tabHistoryRef.current;
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      const previousTab = newHistory[newHistory.length - 1];
      tabHistoryRef.current = newHistory;
      setTabHistory(newHistory);
      router.replace(previousTab as any);
      return true;
    }
    return false;
  }, [router]);

  // Android - bloquer complètement le bouton retour
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      // Toujours retourner true pour bloquer la sortie de l'app
      return true;
    });
    return () => backHandler.remove();
  }, [goBack]);

  // Web - bloquer le bouton retour du navigateur
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !window.history ||
      typeof window.history.pushState !== 'function'
    ) return;

    // Pousser un état initial pour avoir quelque chose à "revenir"
    try {
      window.history.pushState({ tab: true }, '', window.location.href);
    } catch (e) {
      // pushState may throw in some environments; ignore safely
    }

    const handlePopState = () => {
      // Immédiatement repousser un état pour bloquer la navigation
      try {
        window.history.pushState({ tab: true }, '', window.location.href);
      } catch (e) {
        // ignore
      }
      // Ensuite gérer la navigation interne
      goBack();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [goBack]);

  // Réinitialiser quand l'app revient au premier plan
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Ne rien faire de spécial, garder l'état actuel
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Bouton retour dans le header - visible seulement si on a de l'historique
  const HeaderBackButton = () => {
    if (tabHistoryRef.current.length <= 1) {
      return null;
    }
    return (
      <TouchableOpacity
        onPress={goBack}
        style={{ marginLeft: 16, padding: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray[400],
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.white,
        },
        headerTitleStyle: {
          color: COLORS.gray[900],
          fontWeight: '600',
        },
        headerLeft: () => <HeaderBackButton />,
        tabBarStyle: {
          display: 'none',
          borderTopWidth: 1,
          borderTopColor: COLORS.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard.title'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="short-term"
        options={{
          title: t('timeframes.short'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="long-term"
        options={{
          title: t('timeframes.long'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
