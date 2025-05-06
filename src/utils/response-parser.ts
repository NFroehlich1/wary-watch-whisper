
/**
 * Parser für Gemini AI Antworten
 * Extrahiert strukturierte Informationen aus den AI-Antworten
 */

import { RiskLevel } from "../types";

/**
 * Extrahiert die Risikobewertung aus der Gemini-Antwort
 * @param aiResponse - Die Rohantwort von Gemini
 * @returns Die Risikostufe (safe, suspicious oder scam)
 */
export const extractRiskAssessment = (aiResponse: string): RiskLevel => {
  if (aiResponse.toUpperCase().includes('RESULT: SCAM')) {
    return 'scam';
  } else if (aiResponse.toUpperCase().includes('RESULT: HIGH SUSPICION')) {
    return 'suspicious';
  } else if (aiResponse.toUpperCase().includes('RESULT: SUSPICIOUS')) {
    return 'suspicious';
  }
  
  // Default to safe for ambiguous cases
  return 'safe';
};

/**
 * Extrahiert die Erklärung aus der Gemini-Antwort
 * @param aiResponse - Die Rohantwort von Gemini
 * @returns Der Erklärungstext zur Risikobewertung
 */
export const extractExplanation = (aiResponse: string): string => {
  const resultMatch = aiResponse.match(/RESULT: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  
  if (resultMatch) {
    // Alles nach der Klassifikationszeile zurückgeben
    return aiResponse
      .substring(aiResponse.indexOf(resultMatch[0]) + resultMatch[0].length)
      .trim();
  }
  
  // Falls kein Klassifikationsmuster gefunden wurde, die gesamte Antwort zurückgeben
  return aiResponse.trim();
};

/**
 * Bestimmt den Vertrauensgrad basierend auf der Klassifikation in der Antwort
 * @param aiResponse - Die Rohantwort von Gemini
 * @returns Der Vertrauensgrad (high, medium oder low)
 */
export const extractConfidenceLevel = (aiResponse: string): 'high' | 'medium' | 'low' => {
  if (
    aiResponse.toUpperCase().includes('RESULT: SCAM') ||
    aiResponse.toUpperCase().includes('RESULT: SAFE')
  ) {
    return 'high';
  } else if (aiResponse.toUpperCase().includes('RESULT: HIGH SUSPICION')) {
    return 'high';
  } else if (aiResponse.toUpperCase().includes('RESULT: SUSPICIOUS')) {
    return 'medium';
  }
  
  // Standardwert bei unklarer Konfidenzeinstufung
  return 'medium';
};
