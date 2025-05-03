
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

  return translations[key]?.[language] || key;
};

export const detectTextLanguage = (text: string): Language => {
  // Enhanced language detection
  // Check for German first (special characters and common German words)
  if (text.match(/[äöüßÄÖÜ]/i) || 
      /\b(und|oder|für|das|die|der|ein|eine|mal|könntest|wäre)\b/i.test(text)) {
    return 'de';
  }
  // Spanish detection
  if (text.match(/[áéíóúñ¿¡]/i)) return 'es';
  // French detection
  if (text.match(/[àâçéèêëîïôùûüÿœæ]/i)) return 'fr';
  
  // Default to English
  return 'en';
};
