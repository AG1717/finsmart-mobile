import { format, formatDistance } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { Currency } from '../../types';

/**
 * Formater un montant avec devise
 */
export const formatCurrency = (amount: number, currency: Currency): string => {
  return `${currency.symbol}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Formater une date
 */
export const formatDate = (date: string | Date, pattern: string = 'PP', language: 'fr' | 'en' = 'fr'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'fr' ? fr : enUS;

  return format(dateObj, pattern, { locale });
};

/**
 * Formater une date relative (il y a X jours)
 */
export const formatRelativeDate = (date: string | Date, language: 'fr' | 'en' = 'fr'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'fr' ? fr : enUS;

  return formatDistance(dateObj, new Date(), { addSuffix: true, locale });
};

/**
 * Formater un pourcentage
 */
export const formatPercentage = (value: number): string => {
  return `${Math.round(value)}%`;
};

/**
 * Formater un nombre
 */
export const formatNumber = (value: number): string => {
  return value.toLocaleString('en-US');
};

/**
 * Raccourcir un nombre (1000 -> 1K, 1000000 -> 1M)
 */
export const shortenNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};
