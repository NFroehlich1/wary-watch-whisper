
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
  Please respond with a structured markdown answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a concise markdown analysis in this exact format:

  ## 🧠 Quick Analysis

  **🔑 Keywords:** \`keyword_1\`, \`keyword_2\`, \`keyword_3\`  
  **🗣 Common Usage:** Often used to **general_purpose** (e.g. trigger urgency, build trust, mislead).

  **📌 In This Context:**  
  Here, these terms are used to **specific_intent**, likely aiming to **effect_on_reader**.

  **✅ Conclusion:**  
  This language pattern suggests **risk_level**, especially due to **primary_reason**.

  Fill in each placeholder based on your analysis. Keep descriptions brief and to the point.`;
};

/**
 * Erzeugt einen Prompt für Text-Analyse in englischer Sprache
 */
export const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured markdown answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a concise markdown analysis in this exact format:

  ## 🧠 Quick Analysis

  **🔑 Keywords:** \`keyword_1\`, \`keyword_2\`, \`keyword_3\`  
  **🗣 Common Usage:** Often used to **general_purpose** (e.g. trigger urgency, build trust, mislead).

  **📌 In This Context:**  
  Here, these terms are used to **specific_intent**, likely aiming to **effect_on_reader**.

  **✅ Conclusion:**  
  This language pattern suggests **risk_level**, especially due to **primary_reason**.

  Fill in each placeholder based on your analysis. Keep descriptions brief and to the point.`;
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
