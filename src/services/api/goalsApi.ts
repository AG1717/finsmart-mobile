import apiClient from './client';
import { ApiResponse, Goal, CreateGoalData, UpdateGoalData, DashboardData, Category, Timeframe, GoalStatus } from '../../types';

interface GetGoalsParams {
  timeframe?: Timeframe;
  category?: Category;
  status?: GoalStatus;
  page?: number;
  limit?: number;
}

interface GetGoalsResponse {
  goals: Goal[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  statistics: any;
}

export const goalsApi = {
  /**
   * Récupérer tous les objectifs
   */
  getGoals: async (params?: GetGoalsParams): Promise<GetGoalsResponse> => {
    const response = await apiClient.get<ApiResponse<GetGoalsResponse>>('/goals', { params });
    return response.data.data;
  },

  /**
   * Récupérer un objectif par ID
   */
  getGoalById: async (id: string): Promise<Goal> => {
    const response = await apiClient.get<ApiResponse<{ goal: Goal }>>(`/goals/${id}`);
    return response.data.data.goal;
  },

  /**
   * Créer un nouvel objectif
   */
  createGoal: async (data: CreateGoalData): Promise<Goal> => {
    const response = await apiClient.post<ApiResponse<{ goal: Goal }>>('/goals', data);
    return response.data.data.goal;
  },

  /**
   * Mettre à jour un objectif
   */
  updateGoal: async (id: string, data: UpdateGoalData): Promise<Goal> => {
    const response = await apiClient.put<ApiResponse<{ goal: Goal }>>(`/goals/${id}`, data);
    return response.data.data.goal;
  },

  /**
   * Supprimer un objectif
   */
  deleteGoal: async (id: string): Promise<void> => {
    await apiClient.delete(`/goals/${id}`);
  },

  /**
   * Ajouter une contribution
   */
  addContribution: async (id: string, amount: number, note?: string): Promise<Goal> => {
    const response = await apiClient.post<ApiResponse<{ goal: Goal }>>(`/goals/${id}/contribute`, {
      amount,
      note,
    });
    return response.data.data.goal;
  },

  /**
   * Récupérer les données du dashboard
   */
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get<ApiResponse<DashboardData>>('/goals/dashboard');
    return response.data.data;
  },
};
