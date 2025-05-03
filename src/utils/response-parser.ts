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
  if (aiResponse.toLowerCase().includes('classification: scam')) {
    return 'scam';
  } else if (aiResponse.toLowerCase().includes('classification: high suspicion')) {
    return 'suspicious';
  } else if (
    aiResponse.toLowerCase().includes('classification: suspicious') &&
    (aiResponse.toLowerCase().includes('urgent') || 
     aiResponse.toLowerCase().includes('password') ||
     aiResponse.toLowerCase().includes('credential') ||
     aiResponse.toLowerCase().includes('bank details'))
  ) {
    // Only extract as suspicious if specific high-risk indicators are present
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
  const classificationMatch = aiResponse.match(/CLASSIFICATION: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  
  if (classificationMatch) {
    // Alles nach der Klassifikationszeile zurückgeben
    return aiResponse
      .substring(aiResponse.indexOf(classificationMatch[0]) + classificationMatch[0].length)
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
    aiResponse.toLowerCase().includes('classification: scam') ||
    aiResponse.toLowerCase().includes('classification: safe')
  ) {
    return 'high';
  } else if (aiResponse.toLowerCase().includes('classification: high suspicion')) {
    return 'high';
  } else if (aiResponse.toLowerCase().includes('classification: suspicious')) {
    return 'medium';
  }
  
  // Standardwert bei unklarer Konfidenzeinstufung
  return 'medium';
};
