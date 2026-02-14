import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import fr from './fr.json';
import en from './en.json';

const LANGUAGE_KEY = '@finsmart:language';

// Fonction pour récupérer la langue sauvegardée
const getStoredLanguage = async (): Promise<string> => {
  try {
    const language = await AsyncStorage.getItem(LANGUAGE_KEY);
    return language || 'fr';
  } catch (error) {
    return 'fr';
  }
};

// Fonction pour sauvegarder la langue
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialiser i18n
const initI18n = async () => {
  const storedLanguage = await getStoredLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        fr: { translation: fr },
        en: { translation: en },
      },
      lng: storedLanguage,
      fallbackLng: 'fr',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
};

initI18n();

export default i18n;
