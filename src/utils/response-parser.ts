
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
  
  // Financial scam indicators - these are strong scam signals
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION')) ||
      (upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY')) ||
      (upperResponse.includes('PRIZE') && upperResponse.includes('CLAIM')) ||
      (upperResponse.includes('URGENT') && upperResponse.includes('BANK'))) {
    return 'scam';
  }
  
  // Check for common safe chat messages first
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 150 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
    return 'safe';
  }
  
  // Look for suspicious URLs
  if (upperResponse.includes('HTTP://') || upperResponse.includes('HTTPS://') || 
      upperResponse.includes('WWW.') || upperResponse.includes('.COM') || 
      upperResponse.includes('.NET')) {
    return 'suspicious';
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
  
  // Special case for financial scam messages
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION'))) {
    return "This message appears to be requesting financial details, which is a common phishing tactic.";
  }
  
  // Special case for prize scams
  if (upperResponse.includes('PRIZE') && (upperResponse.includes('CLAIM') || upperResponse.includes('WON'))) {
    return "This message contains unsolicited prize claims, a common tactic in advance-fee scams.";
  }
  
  // Special case for account security scams
  if ((upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY'))) {
    return "This message contains fake security alerts designed to trick you into revealing personal information.";
  }
  
  // Check for common safe messages to give a direct explanation
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
  
  // Special case for financial scam messages - high confidence
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION')) ||
      (upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY')) ||
      (upperResponse.includes('PRIZE') && upperResponse.includes('CLAIM'))) {
    return 'high';
  }
  
  // Check for suspicious URLs - medium confidence
  if (upperResponse.includes('HTTP://') || upperResponse.includes('HTTPS://') || 
      upperResponse.includes('WWW.') || upperResponse.includes('.COM') || 
      upperResponse.includes('.NET')) {
    return 'medium';
  }
  
  // Check for common safe messages to give high confidence
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
  
  // Default confidence level for ambiguous cases
  return 'medium';
};
