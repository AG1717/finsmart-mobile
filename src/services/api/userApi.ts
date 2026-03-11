import apiClient from './client';
import { ApiResponse, User } from '../../types';

interface UpdateProfileData {
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  preferences?: {
    language?: string;
    currency?: {
      code: string;
      symbol: string;
    };
    notifications?: boolean;
  };
}

export const userApi = {
  /**
   * Récupérer le profil utilisateur actuel
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<{ user: User }>>('/users/me');
    return response.data.data.user;
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.put<ApiResponse<{ user: User }>>('/users/me', data);
    return response.data.data.user;
  },

  /**
   * Changer le mot de passe
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/users/me/password', {
      currentPassword,
      newPassword,
    });
  },
};
