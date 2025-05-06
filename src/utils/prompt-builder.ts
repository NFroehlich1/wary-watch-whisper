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
  Please respond with a structured answer starting with one of these exact classifications:
  RESULT: SAFE if you're highly confident it's legitimate
  RESULT: SUSPICIOUS if there are minor concerns but not definitively malicious
  RESULT: HIGH SUSPICION if there are significant red flags but not 100% certain
  RESULT: SCAM if you're highly confident it's malicious
  
  Then provide a concise plain text analysis in this format:

  ANALYSIS:
  Brief description of what was found and why this classification was chosen.

  KEY POINTS:
  - Point 1
  - Point 2
  - Point 3

  CONCLUSION:
  Final assessment in 1-2 sentences.

  Use plain text only, no special formatting.`;
};

/**
 * Erzeugt einen Prompt für Text-Analyse in englischer Sprache
 */
export const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer starting with one of these exact classifications:
  RESULT: SAFE if you're highly confident it's legitimate
  RESULT: SUSPICIOUS if there are minor concerns but not definitively malicious
  RESULT: HIGH SUSPICION if there are significant red flags but not 100% certain
  RESULT: SCAM if you're highly confident it's malicious
  
  Then provide a concise plain text analysis in this format:

  ANALYSIS:
  Brief description of what was found and why this classification was chosen.

  KEY POINTS:
  - Point 1
  - Point 2
  - Point 3

  CONCLUSION:
  Final assessment in 1-2 sentences.

  Use plain text only, no special formatting.`;
};

/**
 * Baut den URL-Prompt entsprechend der angegebenen Sprache
 */
export const getUrlPrompt = (url: string, language: Language = 'en'): string => {
  // Momentan nutzen wir nur englische Prompts für konsistentere AI-Ergebnisse
  // Zukünftig könnte dies für mehrsprachige Eingaben erweitert werden
  return getUrlPromptInEnglish(url);
};

/**
 * Baut den Text-Prompt entsprechend der angegebenen Sprache
 */
export const getTextPrompt = (text: string, language: Language = 'en'): string => {
  // Momentan nutzen wir nur englische Prompts für konsistentere AI-Ergebnisse
  // Zukünftig könnte dies für mehrsprachige Eingaben erweitert werden
  return getTextPromptInEnglish(text);
};
