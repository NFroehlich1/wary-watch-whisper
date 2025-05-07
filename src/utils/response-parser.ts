
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
  
  // Check for scam indicators - these are strong indicators even in mixed text
  if ((upperResponse.includes('CREDIT CARD') && upperResponse.includes('VERIFY')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('VERIFY') && upperResponse.includes('URGENT')) ||
      (upperResponse.includes('HTTP://VERIFY') || upperResponse.includes('HTTP://BANK'))) {
    return 'scam';
  }
  
  // Check for common safe messages first
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
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
  const upperResponse = aiResponse.toUpperCase();
  
  // Special case for scam messages with specific patterns
  if ((upperResponse.includes('CREDIT CARD') && upperResponse.includes('VERIFY')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('VERIFY') && upperResponse.includes('URGENT')) ||
      (upperResponse.includes('HTTP://VERIFY') || upperResponse.includes('HTTP://BANK'))) {
    return "This message contains typical phishing patterns requesting financial information or urgent banking action.";
  }
  
  // Check for common safe messages first to give a direct explanation
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
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
  
  // Special case for scam messages with specific patterns
  if ((upperResponse.includes('CREDIT CARD') && upperResponse.includes('VERIFY')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('VERIFY') && upperResponse.includes('URGENT')) ||
      (upperResponse.includes('HTTP://VERIFY') || upperResponse.includes('HTTP://BANK'))) {
    return 'high';
  }
  
  // Check for common safe messages first to give high confidence
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
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
