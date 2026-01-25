// Types principaux de l'application

export type Category = 'survival' | 'necessity' | 'lifestyle';
export type Timeframe = 'short' | 'long';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type Language = 'fr' | 'en';

export interface Currency {
  code: string;
  symbol: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  preferences: {
    language: Language;
    currency: Currency;
    notifications: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  category: Category;
  timeframe: Timeframe;
  amounts: {
    current: number;
    target: number;
    currency: Currency;
  };
  progress: {
    percentage: number;
    lastUpdated: string;
  };
  dates: {
    target?: string;
    started: string;
    completed?: string;
  };
  status: GoalStatus;
  icon: string;
  metadata?: {
    contributions: Contribution[];
    milestones: Milestone[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface Contribution {
  amount: number;
  date: string;
  note?: string;
}

export interface Milestone {
  percentage: number;
  achievedAt: string;
}

export interface CategoryInfo {
  _id: string;
  name: Category;
  label: {
    fr: string;
    en: string;
  };
  description: {
    fr: string;
    en: string;
  };
  icon: string;
  color: string;
  order: number;
}

export interface DashboardData {
  overview: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  };
  byTimeframe: {
    short: TimeframeStats;
    long: TimeframeStats;
  };
  byCategory: {
    survival: CategoryStats;
    necessity: CategoryStats;
    lifestyle: CategoryStats;
  };
  recentGoals: Goal[];
  nearCompletion: Goal[];
}

export interface TimeframeStats {
  count: number;
  targetAmount: number;
  currentAmount: number;
  progress: number;
}

export interface CategoryStats {
  count: number;
  targetAmount: number;
  currentAmount: number;
  progress: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  language?: Language;
  currency?: Currency;
}

export interface CreateGoalData {
  name: string;
  description?: string;
  category: Category;
  timeframe: Timeframe;
  amounts: {
    current?: number;
    target: number;
    currency?: Currency;
  };
  dates?: {
    target?: string;
  };
  icon?: string;
}

export interface UpdateGoalData {
  name?: string;
  description?: string;
  category?: Category;
  timeframe?: Timeframe;
  amounts?: {
    current?: number;
    target?: number;
    currency?: Currency;
  };
  dates?: {
    target?: string | null;
  };
  status?: GoalStatus;
  icon?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
