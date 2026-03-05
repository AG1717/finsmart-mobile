import { create } from 'zustand';
import { RegisterData, User } from '../types';
import { authApi } from '../services/api/authApi';
import { clearTokens, getAccessToken, saveTokens } from '../services/storage/tokenStorage';

interface ApiErrorShape {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
    };
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.login(email, password);

      await saveTokens(response.tokens.accessToken, response.tokens.refreshToken);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const typedError = error as ApiErrorShape;
      set({
        error: typedError.response?.data?.error?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authApi.register(data);

      await saveTokens(response.tokens.accessToken, response.tokens.refreshToken);

      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const typedError = error as ApiErrorShape;
      set({
        error: typedError.response?.data?.error?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await clearTokens();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  checkAuth: async () => {
    try {
      const token = await getAccessToken();
      set({ isAuthenticated: !!token, isLoading: false });
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
