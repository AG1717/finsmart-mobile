import apiClient from './client';
import { ApiResponse, LoginResponse, RegisterData } from '../../types';

export const authApi = {
  /**
   * Inscription d'un nouvel utilisateur
   */
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/register', data);
    return response.data.data;
  },

  /**
   * Connexion d'un utilisateur
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  },

  /**
   * Déconnexion
   */
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  /**
   * Rafraîchir le token
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> => {
    const response = await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  /**
   * Demander un code de réinitialisation de mot de passe
   */
  forgotPassword: async (email: string): Promise<{ message: string; resetCode?: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string; resetCode?: string }>>(
      '/auth/forgot-password',
      { email }
    );
    return response.data.data;
  },

  /**
   * Réinitialiser le mot de passe avec le code
   */
  resetPassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/reset-password',
      { email, code, newPassword }
    );
    return response.data.data;
  },
};
