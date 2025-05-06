
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
 * Erzeugt einen Prompt für eine gezielte Analysefrage
 */
export const getAnalysisQuestionPromptInEnglish = (question: string, content: string, riskLevel: string, explanation: string): string => {
  return `You are analyzing a message or URL that was classified as ${riskLevel.toUpperCase()}.
  
  The content was: "${content}"
  Initial analysis: ${explanation}
  
  Answer this specific question: "${question}"
  
  Focus ONLY on the question asked. Be direct and concise (3-4 sentences maximum).
  Use plain text without prefixes like "Answer:" or "Response:".
  If you cannot answer with the information provided, clearly state so.`;
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

/**
 * Baut den Analysefrage-Prompt entsprechend der angegebenen Sprache
 */
export const getAnalysisQuestionPrompt = (question: string, content: string, riskLevel: string, explanation: string, language: Language = 'en'): string => {
  // Momentan nutzen wir nur englische Prompts für konsistentere AI-Ergebnisse
  return getAnalysisQuestionPromptInEnglish(question, content, riskLevel, explanation);
};
