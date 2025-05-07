
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
  
  // Check for common absolutely safe chat messages first - very specific patterns
  if (aiResponse.length < 150) {
    const simpleGreetings = /^(THANKS|THANK YOU|HELLO|HI|HEY|OK|YES|NO|SURE|COOL|GREAT|FINE)$/i;
    if (simpleGreetings.test(aiResponse.trim())) {
      return 'safe';
    }
  }
  
  // STRONGER FINANCIAL SCAM DETECTION - these are definite scam signals
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('SHARE')) ||
      (upperResponse.includes('BANKING') && upperResponse.includes('PLATFORM')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION')) ||
      (upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY')) ||
      (upperResponse.includes('PRIZE') && upperResponse.includes('CLAIM')) ||
      (upperResponse.includes('URGENT') && upperResponse.includes('BANK')) ||
      (upperResponse.includes('SHARE') && upperResponse.includes('PASSWORD')) ||
      (upperResponse.includes('SECURITY ISSUE') && upperResponse.includes('ACCOUNT')) ||
      (upperResponse.includes('BETTER RATES') && upperResponse.includes('BANK'))) {
    return 'scam';
  }
  
  // Look for suspicious URLs
  if (upperResponse.includes('HTTP://') || 
      (upperResponse.includes('HTTPS://') && upperResponse.includes('CLICK')) || 
      (upperResponse.includes('WWW.') && upperResponse.includes('ENTER')) || 
      upperResponse.includes('.COM/VERIFY') || 
      upperResponse.includes('.NET/LOGIN')) {
    return 'suspicious';
  }
  
  // Check for information gathering - strengthen this pattern to catch subtle attempts
  if ((upperResponse.includes('COULD YOU SHARE') || 
       upperResponse.includes('PLEASE PROVIDE') ||
       upperResponse.includes('SHARE YOUR') ||
       upperResponse.includes('TELL ME YOUR')) &&
      (upperResponse.includes('EMAIL') || 
       upperResponse.includes('PHONE') || 
       upperResponse.includes('ADDRESS') || 
       upperResponse.includes('FULL NAME') ||
       upperResponse.includes('BANK') ||
       upperResponse.includes('ACCOUNT') ||
       upperResponse.includes('DETAILS'))) {
    return 'suspicious';
  }
  
  // Check for messages that mention saving money or better rates with financial institutions
  if ((upperResponse.includes('SAVE MONEY') || upperResponse.includes('BETTER RATES')) &&
      (upperResponse.includes('FINANCIAL') || upperResponse.includes('BANK') || upperResponse.includes('INVESTMENT'))) {
    return 'suspicious';
  }
  
  // Check for common safe chat patterns - these take precedence over suspicious indicators
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 200 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
    return 'safe';
  }
  
  // Check for explicit classification markers
  if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    return 'suspicious';
  } else if (upperResponse.includes('RESULT: SCAM')) {
    return 'scam';
  } else if (upperResponse.includes('RESULT: SUSPICIOUS')) {
    return 'suspicious';
  } else if (upperResponse.includes('RESULT: SAFE')) {
    return 'safe';
  }
  
  // Default to safe for general conversational messages
  if (aiResponse.length < 180 && 
      !upperResponse.includes('MONEY') && 
      !upperResponse.includes('BANK') && 
      !upperResponse.includes('CLICK') &&
      !upperResponse.includes('VERIFY')) {
    return 'safe';
  }
  
  // Default to suspicious for ambiguous cases
  return 'suspicious';
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
      (upperResponse.includes('BANKING PLATFORM') && upperResponse.includes('SHARE')) ||
      (upperResponse.includes('BETTER RATES') && upperResponse.includes('BANK DETAILS'))) {
    return "This message requests banking or financial details, which is a classic phishing tactic used by scammers.";
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
  
  // Special case for subtle information gathering
  if ((upperResponse.includes('COULD YOU SHARE') || upperResponse.includes('PLEASE PROVIDE') || 
       upperResponse.includes('SHARE YOUR') || upperResponse.includes('IF YOU SHARE')) &&
      (upperResponse.includes('EMAIL') || upperResponse.includes('PHONE') || 
       upperResponse.includes('ADDRESS') || upperResponse.includes('FULL NAME') ||
       upperResponse.includes('BANK') || upperResponse.includes('DETAILS'))) {
    return "This message is attempting to gather personal or financial information which could be used for identity theft or fraud.";
  }
  
  // Check for common safe messages to give a direct explanation
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT)\b/i;
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 200 && 
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
  
  // Default explanation for ambiguous cases
  if (upperResponse.length < 180 && !upperResponse.includes('MONEY') && !upperResponse.includes('BANK')) {
    return "This appears to be a normal conversational message without suspicious elements.";
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
      (upperResponse.includes('BANKING PLATFORM') && upperResponse.includes('BETTER RATES')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION')) ||
      (upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY')) ||
      (upperResponse.includes('PRIZE') && upperResponse.includes('CLAIM'))) {
    return 'high';
  }
  
  // Check for simple, obviously safe messages - high confidence
  const simpleGreetings = /^(THANKS|THANK YOU|HELLO|HI|HEY|OK|YES|NO|SURE|COOL|GREAT|FINE)$/i;
  if (simpleGreetings.test(aiResponse.trim())) {
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
  if (commonSafeMessages.test(aiResponse) && aiResponse.length < 200 && 
      !upperResponse.includes('PASSWORD') && !upperResponse.includes('URGENT') && 
      !upperResponse.includes('BANK') && !upperResponse.includes('VERIFY')) {
    return 'high';
  }
  
  if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    return 'high';
  } else if (upperResponse.includes('RESULT: SCAM') || upperResponse.includes('RESULT: SAFE')) {
    return 'high';
  } else if (upperResponse.includes('RESULT: SUSPICIOUS')) {
    return 'medium';
  }
  
  // Default confidence level for ambiguous cases
  return 'medium';
};
