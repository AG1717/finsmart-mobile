import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/tokenStorage';
import { ApiError } from '../../types';

// URL de production sur Render
const API_BASE_URL = 'https://finsmart-backend-foc5.onrender.com/api/v1';

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

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse - gérer le refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
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
