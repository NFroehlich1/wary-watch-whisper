
/**
 * Modul zur Generierung strukturierter Prompts für die AI-basierte Analyse
 */
import { Language } from "../types";

/**
 * Generiert einen URL-Analyse-Prompt in Englisch
 * @param url - Die zu analysierende URL
 * @returns Formatierter Prompt-String
 */
export const getUrlPromptInEnglish = (url: string): string => {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
};

/**
 * Generiert einen Text-Analyse-Prompt in Englisch
 * @param text - Der zu analysierende Text
 * @returns Formatierter Prompt-String
 */
export const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
};

/**
 * Mehrsprachiger URL-Prompt-Generator (wird aus Kompatibilitätsgründen beibehalten)
 * @param url - Die zu analysierende URL
 * @param language - Die gewünschte Sprache
 * @returns Formatierter Prompt-String in der angegebenen Sprache
 */
export const getUrlPrompt = (url: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si esta URL es segura, sospechosa o una estafa. URL: "${url}". Por favor, clasifícala como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si cette URL est sûre, suspecte ou une arnaque. URL: "${url}". Veuillez la classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else if (language === 'de') {
    return `Analysieren Sie, ob diese URL sicher, verdächtig oder betrügerisch ist. URL: "${url}". Bitte klassifizieren Sie sie als "safe", "suspicious" oder "scam" und geben Sie eine kurze Begründung an.`;
  } else {
    return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};

/**
 * Mehrsprachiger Text-Prompt-Generator (wird aus Kompatibilitätsgründen beibehalten)
 * @param text - Der zu analysierende Text
 * @param language - Die gewünschte Sprache
 * @returns Formatierter Prompt-String in der angegebenen Sprache
 */
export const getTextPrompt = (text: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si este mensaje contiene indicios de estafa, contenido sospechoso o si es seguro. Mensaje: "${text}". Por favor, clasifícalo como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si ce message contient des signes d'arnaque, un contenu suspect ou s'il est sûr. Message: "${text}". Veuillez le classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else if (language === 'de') {
    return `Analysieren Sie, ob diese Nachricht Anzeichen für Betrug enthält, verdächtigen Inhalt oder ob sie sicher ist. Nachricht: "${text}". Bitte klassifizieren Sie sie als "safe", "suspicious" oder "scam" und geben Sie eine kurze Begründung an.`;
  } else {
    return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};
