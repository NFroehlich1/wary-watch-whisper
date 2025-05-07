
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
  const upperResponse = aiResponse.toUpperCase();
  
  // Check for common safe messages first
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150) {
    return 'safe';
  }
  
  // Check for HIGH SUSPICION first (more specific than just SUSPICIOUS)
  if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    return 'suspicious';
  } else if (upperResponse.includes('RESULT: SCAM')) {
    return 'scam';
  } else if (upperResponse.includes('RESULT: SUSPICIOUS')) {
    return 'suspicious';
  } else if (upperResponse.includes('RESULT: SAFE')) {
    return 'safe';
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
  // Check for common safe messages first to give a direct explanation
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150) {
    return "This is a standard chat message with no suspicious elements.";
  }
  
  const resultPattern = /RESULT:\s*(SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i;
  const resultMatch = aiResponse.match(resultPattern);
  
  if (resultMatch) {
    const resultIndex = aiResponse.indexOf(resultMatch[0]);
    const afterResult = aiResponse.substring(resultIndex + resultMatch[0].length).trim();
    return afterResult;
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
  const upperResponse = aiResponse.toUpperCase();
  
  // Check for common safe messages first to give high confidence
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150) {
    return 'high';
  }
  
  if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    return 'high';
  } else if (
    upperResponse.includes('RESULT: SCAM') ||
    upperResponse.includes('RESULT: SAFE')
  ) {
    return 'high';
  } else if (upperResponse.includes('RESULT: SUSPICIOUS')) {
    return 'medium';
  }
  
  // Standardwert bei unklarer Konfidenzeinstufung
  return 'medium';
};
