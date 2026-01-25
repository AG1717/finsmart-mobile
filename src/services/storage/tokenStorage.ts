import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'finsmart_access_token';
const REFRESH_TOKEN_KEY = 'finsmart_refresh_token';

/**
 * Vérifier si SecureStore est disponible (pas sur le web)
 */
const isSecureStoreAvailable = Platform.OS !== 'web';

/**
 * Sauvegarder les tokens de manière sécurisée
 */
export const saveTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      // Fallback pour le web - utiliser localStorage
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (error) {
    console.error('Error saving tokens:', error);
    throw error;
  }
};

/**
 * Récupérer l'access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  try {
    if (isSecureStoreAvailable) {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } else {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

/**
 * Récupérer le refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    if (isSecureStoreAvailable) {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } else {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error getting refresh token:', error);
    return null;
  }
};

/**
 * Supprimer tous les tokens
 */
export const clearTokens = async (): Promise<void> => {
  try {
    if (isSecureStoreAvailable) {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error clearing tokens:', error);
  }
};
