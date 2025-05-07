
import { Language } from "../types";

export const getTranslation = (key: string, language: Language): string => {
  const translations: Record<string, Record<Language, string>> = {
    scamDetected: {
      en: 'Scam detected',
      es: 'Estafa detectada',
      fr: 'Arnaque détectée',
      de: 'Betrug erkannt'
    },
    suspicious: {
      en: 'Suspicious content',
      es: 'Contenido sospechoso',
      fr: 'Contenu suspect',
      de: 'Verdächtiger Inhalt'
    },
    safe: {
      en: 'Safe content',
      es: 'Contenido seguro',
      fr: 'Contenu sécurisé',
      de: 'Sicherer Inhalt'
    },
    analyze: {
      en: 'Analyze',
      es: 'Analizar',
      fr: 'Analyser',
      de: 'Analysieren'
    },
    listen: {
      en: 'Listen to Result',
      es: 'Escuchar resultado',
      fr: 'Écouter le résultat',
      de: 'Ergebnis anhören'
    }
  };

  // Always return English translation
  return translations[key]?.['en'] || key;
};

// Modified to always detect as English regardless of text content
export const detectTextLanguage = (text: string): Language => {
  // Always return English
  return 'en';
};
