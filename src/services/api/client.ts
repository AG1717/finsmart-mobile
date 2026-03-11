import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/tokenStorage';
import { ApiError } from '../../types';

const DEFAULT_PRODUCTION_API_URL = 'https://finsmart-backend.onrender.com/api/v1';
const API_REQUEST_TIMEOUT_MS = 30000;

const getApiUrl = () => {
  const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (envApiUrl) {
    console.log('[API] Using EXPO_PUBLIC_API_URL:', envApiUrl);
    return envApiUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('[API] Using default production URL (deployed web):', DEFAULT_PRODUCTION_API_URL);
      return DEFAULT_PRODUCTION_API_URL;
    }

    console.log('[API] Using localhost for local web development');
    return 'http://localhost:3000/api/v1';
  }

  if (!__DEV__) {
    console.warn('[API] EXPO_PUBLIC_API_URL missing in production, using default production URL');
    return DEFAULT_PRODUCTION_API_URL;
  }

  let host = Constants.expoConfig?.hostUri?.split(':')[0];

  if (!host && Constants.manifest) {
    const debuggerHost = Constants.manifest.debuggerHost;
    host = debuggerHost?.split(':')[0];
  }

  if (!host && Constants.manifest2) {
    const debuggerHost = Constants.manifest2.extra?.expoGo?.debuggerHost;
    host = debuggerHost?.split(':')[0];
  }

  if (host) {
    const url = `http://${host}:3000/api/v1`;
    console.log('[API] Auto-detected dev host:', host);
    return url;
  }

  console.warn('[API] Could not auto-detect dev host, using localhost fallback');
  return 'http://localhost:3000/api/v1';
};

export const API_BASE_URL = getApiUrl();
console.log('[API] Final API Base URL:', API_BASE_URL);

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
  timeoutErrorMessage: `Request timeout after ${API_REQUEST_TIMEOUT_MS}ms`,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((subscriber) => subscriber.resolve(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error: unknown) => {
  refreshSubscribers.forEach((subscriber) => subscriber.reject(error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = () => new Promise<string>((resolve, reject) => {
  refreshSubscribers.push({ resolve, reject });
});

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return addRefreshSubscriber().then((token: string) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();

        if (!refreshToken) {
          await clearTokens();
          throw error;
        }

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        await saveTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        onRefreshed(accessToken);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
