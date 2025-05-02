
import { Language } from "../types";

export const getTranslation = (key: string, language: Language): string => {
  const translations: Record<string, Record<Language, string>> = {
    scamDetected: {
      en: 'Scam detected',
      es: 'Estafa detectada',
      fr: 'Arnaque détectée'
    },
    suspicious: {
      en: 'Suspicious content',
      es: 'Contenido sospechoso',
      fr: 'Contenu suspect'
    },
    safe: {
      en: 'Safe content',
      es: 'Contenido seguro',
      fr: 'Contenu sécurisé'
    },
    analyze: {
      en: 'Analyze',
      es: 'Analizar',
      fr: 'Analyser'
    },
    listen: {
      en: 'Listen to Result',
      es: 'Escuchar resultado',
      fr: 'Écouter le résultat'
    }
  };

  return translations[key]?.[language] || key;
};

export const detectTextLanguage = (text: string): Language => {
  // Very simple language detection for demo
  // In a real app, use a proper language detection library
  if (text.match(/[áéíóúñ¿¡]/i)) return 'es';
  if (text.match(/[àâçéèêëîïôùûüÿœæ]/i)) return 'fr';
  return 'en';
};
