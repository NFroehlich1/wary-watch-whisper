
/**
 * Generiert Prompts für die Gemini AI Anfragen
 * Diese Datei enthält Funktionen zur Erstellung strukturierter Prompts
 */

import { Language } from "../types";

/**
 * Erzeugt einen Prompt für URL-Analyse in englischer Sprache
 */
export const getUrlPromptInEnglish = (url: string): string => {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS 
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
};

/**
 * Erzeugt einen Prompt für Text-Analyse in englischer Sprache
 */
export const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
};

/**
 * Baut den URL-Prompt entsprechend der angegebenen Sprache
 */
export const getUrlPrompt = (url: string, language: Language = 'en'): string => {
  // Momentan nutzen wir nur englische Prompts für konsistentere AI-Ergebnisse
  return getUrlPromptInEnglish(url);
};

/**
 * Baut den Text-Prompt entsprechend der angegebenen Sprache
 */
export const getTextPrompt = (text: string, language: Language = 'en'): string => {
  // Momentan nutzen wir nur englische Prompts für konsistentere AI-Ergebnisse
  return getTextPromptInEnglish(text);
};
