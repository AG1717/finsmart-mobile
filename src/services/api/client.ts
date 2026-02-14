import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/tokenStorage';
import { ApiError } from '../../types';

// Fonction pour obtenir l'URL de l'API automatiquement
const getApiUrl = () => {
  console.log('🔍 [API] Detecting API URL...');
  console.log('🔍 [API] Platform:', Platform.OS);

  // En production
  // return 'https://finsmart-api.geniusmedia.net/api/v1';

  // En développement local - WEB
  if (Platform.OS === 'web') {
    console.log('✅ [API] Using localhost for web');
    return 'http://localhost:3000/api/v1';
  }

  // Sur mobile (Expo Go), essayez différentes méthodes de détection
  console.log('🔍 [API] Constants.expoConfig:', Constants.expoConfig);
  console.log('🔍 [API] hostUri:', Constants.expoConfig?.hostUri);

  // Méthode 1: expoConfig.hostUri (nouveau)
  let host = Constants.expoConfig?.hostUri?.split(':')[0];

  // Méthode 2: manifest.debuggerHost (ancien, pour compatibilité)
  if (!host && Constants.manifest) {
    const debuggerHost = Constants.manifest.debuggerHost;
    host = debuggerHost?.split(':')[0];
    console.log('🔍 [API] Using manifest.debuggerHost:', debuggerHost);
  }

  // Méthode 3: manifest2
  if (!host && Constants.manifest2) {
    const debuggerHost = Constants.manifest2.extra?.expoGo?.debuggerHost;
    host = debuggerHost?.split(':')[0];
    console.log('🔍 [API] Using manifest2.debuggerHost:', debuggerHost);
  }

  if (host) {
    const url = `http://${host}:3000/api/v1`;
    console.log('✅ [API] Auto-detected host:', host);
    console.log('✅ [API] API URL:', url);
    return url;
  }

  // Fallback sur l'IP manuelle si la détection échoue
  console.warn('⚠️ [API] Could not auto-detect host, using fallback IP: 192.168.1.5');
  return 'http://192.168.1.5:3000/api/v1';
};

const API_BASE_URL = getApiUrl();
console.log('🌐 [API] Final API Base URL:', API_BASE_URL);

// Créer l'instance Axios
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 secondes pour le cold start de Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag pour éviter les appels multiples de refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Fonction pour notifier tous les abonnés quand le token est rafraîchi
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

// Fonction pour ajouter un abonné
const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Intercepteur de requête - ajouter le token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de debug pour voir les requêtes
    console.log('🌐 [API Request]', {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      hasAuth: !!token,
      data: config.data,
    });

    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse - gérer le refresh token
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ [API Response]', {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
      success: response.data?.success,
    });
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    console.error('❌ [API Response Error]', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error?.message || error.message,
      code: error.code,
    });
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et on n'a pas déjà essayé de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, attendre qu'il se termine
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(apiClient(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          // Pas de refresh token, déconnecter l'utilisateur
          await clearTokens();
          throw error;
        }

        // Appeler l'endpoint de refresh
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // Sauvegarder les nouveaux tokens
        await saveTokens(accessToken, newRefreshToken);

        // Mettre à jour le header de la requête originale
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Notifier tous les abonnés
        onRefreshed(accessToken);

        isRefreshing = false;

        // Réessayer la requête originale
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Échec du refresh, déconnecter l'utilisateur
        isRefreshing = false;
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
