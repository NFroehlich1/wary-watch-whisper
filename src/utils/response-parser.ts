
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
  
  // Enhanced pattern for safe introductions/greetings
  const introductionPattern = /\b(HELLO|HI|HEY|GREETING|WELCOME).+(ADVISOR|ASSISTANT|AI|HELP|TODAY)\b/i;
  const isIntroduction = introductionPattern.test(upperResponse);
  
  // Additional check for common AI assistant introduction patterns
  const assistantIntroPattern = /(I('M| AM) (YOUR|AN?) .*(ADVISOR|ASSISTANT|AI)|HOW CAN I HELP YOU)/i;
  const isAssistantIntro = assistantIntroPattern.test(aiResponse);
  
  // If it's a standard introduction message without suspicious elements, mark as safe immediately
  if ((isIntroduction || isAssistantIntro) && 
      !upperResponse.includes('ACCOUNT NUMBER') && 
      !upperResponse.includes('CREDIT CARD') &&
      !upperResponse.includes('BANK DETAILS') &&
      !upperResponse.includes('INVESTMENT PROGRAM') &&
      !upperResponse.includes('GUARANTEED') &&
      !upperResponse.includes('RETURNS') &&
      !upperResponse.includes('EXCLUSIVE OPPORTUNITY')) {
    return 'safe';
  }
  
  // Check for common absolutely safe chat messages first - very specific patterns
  if (aiResponse.length < 150) {
    const simpleGreetings = /^(THANKS|THANK YOU|HELLO|HI|HEY|OK|YES|NO|SURE|COOL|GREAT|FINE)$/i;
    if (simpleGreetings.test(aiResponse.trim())) {
      return 'safe';
    }
  }
  
  // NEW: Detect indirect financial questions and implicit solicitations
  if ((upperResponse.includes('INVESTMENT PROGRAM')) || 
      (upperResponse.includes('GUARANTEED') && upperResponse.includes('RETURNS')) ||
      (upperResponse.includes('EXCLUSIVE') && upperResponse.includes('INVESTMENT')) ||
      (upperResponse.includes('SELECT CLIENTS') && upperResponse.includes('ACCESS')) ||
      (upperResponse.includes('OFFERING') && upperResponse.includes('ACCESS')) ||
      (upperResponse.includes('WOULD YOU LIKE TO') && (
        upperResponse.includes('INVESTMENT') || 
        upperResponse.includes('FINANCIAL') || 
        upperResponse.includes('MONEY') || 
        upperResponse.includes('OPPORTUNITY')
      ))) {
    return 'suspicious';
  }
  
  // STRONGER FINANCIAL SCAM DETECTION - enhanced for multi-stage scams
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('BANKING') && upperResponse.includes('PLATFORM')) ||
      (upperResponse.includes('CREDIT CARD') && upperResponse.includes('INFORMATION')) ||
      (upperResponse.includes('ACCOUNT') && upperResponse.includes('COMPROMISED')) ||
      (upperResponse.includes('VERIFY') && upperResponse.includes('IDENTITY')) ||
      (upperResponse.includes('PRIZE') && upperResponse.includes('CLAIM')) ||
      (upperResponse.includes('URGENT') && upperResponse.includes('BANK')) ||
      (upperResponse.includes('SHARE') && upperResponse.includes('PASSWORD')) ||
      (upperResponse.includes('SECURITY ISSUE') && upperResponse.includes('ACCOUNT')) ||
      (upperResponse.includes('BETTER RATES') && upperResponse.includes('BANK')) ||
      (upperResponse.includes('SECURITY VERIFICATION')) ||
      (upperResponse.includes('ACCOUNT NUMBER') && upperResponse.includes('ROUTING')) ||
      (upperResponse.includes('SOCIAL SECURITY')) ||
      (upperResponse.includes('DATE OF BIRTH') && upperResponse.includes('VERIFICATION')) ||
      (upperResponse.includes('VIP PROGRAM')) ||
      (upperResponse.includes('TRIPLE WHAT') && upperResponse.includes('BANKS')) ||
      (upperResponse.includes('TRANSFER YOUR FUNDS') && upperResponse.includes('HOURS')) ||
      (upperResponse.includes('LIMITED-TIME') && upperResponse.includes('EXPIRES'))) {
    return 'scam';
  }
  
  // Look for suspicious URLs and urgent action requests
  if (upperResponse.includes('HTTP://') || 
      (upperResponse.includes('HTTPS://') && upperResponse.includes('CLICK')) || 
      (upperResponse.includes('WWW.') && upperResponse.includes('ENTER')) || 
      upperResponse.includes('.COM/VERIFY') || 
      upperResponse.includes('.NET/LOGIN') ||
      (upperResponse.includes('24 HOURS') && upperResponse.includes('SECURE'))) {
    return 'suspicious';
  }
  
  // Check for information gathering - strengthen this pattern to catch subtle attempts
  if ((upperResponse.includes('COULD YOU SHARE') || 
       upperResponse.includes('PLEASE PROVIDE') ||
       upperResponse.includes('SHARE YOUR') ||
       upperResponse.includes('TELL ME YOUR') ||
       upperResponse.includes('WHICH BANK') ||
       upperResponse.includes('PREFERRED PAYMENT METHOD')) &&
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
  
  // NEW: Explanation for indirect financial solicitation
  if ((upperResponse.includes('INVESTMENT PROGRAM')) || 
      (upperResponse.includes('GUARANTEED') && upperResponse.includes('RETURNS')) ||
      (upperResponse.includes('EXCLUSIVE') && upperResponse.includes('INVESTMENT')) ||
      (upperResponse.includes('SELECT CLIENTS') && upperResponse.includes('ACCESS'))) {
    return "This message contains indirect financial solicitation with promises of exclusive investment opportunities or guaranteed returns, which are common in scams.";
  }
  
  // Enhanced explanations for multi-stage scam patterns
  if ((upperResponse.includes('BANK') && upperResponse.includes('DETAILS')) ||
      (upperResponse.includes('BANKING PLATFORM') && upperResponse.includes('SHARE')) ||
      (upperResponse.includes('BETTER RATES') && upperResponse.includes('BANK DETAILS'))) {
    return "This message requests banking or financial details, which is a classic phishing tactic used by scammers.";
  }
  
  // Explanation for account verification scams
  if (upperResponse.includes('ACCOUNT NUMBER') && 
      (upperResponse.includes('ROUTING') || upperResponse.includes('VERIFICATION'))) {
    return "This message is requesting sensitive banking information that should never be shared in chat conversations.";
  }
  
  // Explanation for time-sensitive scams
  if ((upperResponse.includes('LIMITED-TIME') || upperResponse.includes('EXPIRES TODAY') || 
      upperResponse.includes('24 HOURS')) && 
      (upperResponse.includes('OFFER') || upperResponse.includes('OPPORTUNITY'))) {
    return "This message creates false urgency, a common tactic in scams to pressure victims into making hasty decisions.";
  }
  
  // Explanation for personal verification scams
  if ((upperResponse.includes('SOCIAL SECURITY') || upperResponse.includes('DATE OF BIRTH')) && 
      upperResponse.includes('VERIFICATION')) {
    return "This message is requesting highly sensitive personal information that legitimate services would never ask for in a chat.";
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
  
  // NEW: High confidence for indirect financial solicitation
  if ((upperResponse.includes('INVESTMENT PROGRAM')) || 
      (upperResponse.includes('GUARANTEED') && upperResponse.includes('RETURNS')) ||
      (upperResponse.includes('EXCLUSIVE') && upperResponse.includes('INVESTMENT')) ||
      (upperResponse.includes('SELECT CLIENTS') && upperResponse.includes('ACCESS'))) {
    return 'high';
  }
  
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
