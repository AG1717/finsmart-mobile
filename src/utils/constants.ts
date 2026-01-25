import { Currency } from '../types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'Fr' },
  { code: 'INR', symbol: '₹' },
  { code: 'BRL', symbol: 'R$' },
  { code: 'XOF', symbol: 'CFA' },
];

export const GOAL_ICONS = [
  'home',
  'car',
  'airplane',
  'book',
  'briefcase',
  'heart',
  'star',
  'gift',
  'camera',
  'trophy',
  'medical',
  'school',
  'fitness',
  'restaurant',
  'shopping-bag',
];

export const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#22C55E',
  info: '#06B6D4',

  // Category colors
  survival: '#EF4444',
  necessity: '#F59E0B',
  lifestyle: '#10B981',

  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

export const CATEGORY_INFO = {
  survival: {
    color: COLORS.survival,
    icon: 'shield-checkmark',
  },
  necessity: {
    color: COLORS.necessity,
    icon: 'car',
  },
  lifestyle: {
    color: COLORS.lifestyle,
    icon: 'star',
  },
};
