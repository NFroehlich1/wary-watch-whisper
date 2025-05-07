
/**
 * Ultra-simplified response parser for Gemini API responses
 */

/**
 * Processes the AI response to extract minimal classification information
 * @param aiResponse - The raw response from Gemini
 * @returns Structured response with risk level, confidence, and explanation
 */
export function processAiResponse(aiResponse) {
  // Default values
  let riskLevel = 'safe';
  let confidenceLevel = 'medium';
  let explanation = '';

  // Simple string-based detection - case insensitive
  const upperResponse = aiResponse.toUpperCase();
  
  // Enhanced pattern for safe introductions/greetings
  const introductionPattern = /\b(HELLO|HI|HEY|GREETING|WELCOME).+(ADVISOR|ASSISTANT|AI|HELP|TODAY)\b/i;
  const isIntroduction = introductionPattern.test(upperResponse);
  
  // Additional check for common AI assistant introduction patterns
  const assistantIntroPattern = /(I('M| AM) (YOUR|AN?) .*(ADVISOR|ASSISTANT|AI)|HOW CAN I HELP YOU)/i;
  const isAssistantIntro = assistantIntroPattern.test(aiResponse);
  
  // If it's a standard introduction message, mark as safe immediately
  if ((isIntroduction || isAssistantIntro) && !containsSuspiciousPatterns(aiResponse)) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
    explanation = "This is a standard greeting or introduction message with no suspicious elements.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Check for common greeting patterns that should always be classified as safe
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT|NICE TO (MEET|CHAT))\b/i;
  const containsCommonSafe = commonSafeMessages.test(aiResponse);
  
  // STRONGER FINANCIAL SCAM DETECTION - specifically targeting multi-stage scam patterns
  const containsFinancialScamIndicators = 
    (upperResponse.includes('BANKING PLATFORM') || 
     upperResponse.includes('BETTER RATES') || 
     upperResponse.includes('SHARE') && upperResponse.includes('BANK DETAILS') ||
     upperResponse.includes('CURRENT BANK') ||
     upperResponse.includes('ACCOUNT NUMBER') || 
     upperResponse.includes('ROUTING INFORMATION') ||
     upperResponse.includes('VERIFICATION DEPOSIT') ||
     upperResponse.includes('SECURITY VERIFICATION') ||
     upperResponse.includes('SAVE MONEY') && upperResponse.includes('BANK') ||
     upperResponse.includes('LIMITED-TIME OFFER') ||
     upperResponse.includes('TRANSFER YOUR FUNDS') ||
     upperResponse.includes('PREMIUM RATES') ||
     upperResponse.includes('VIP PROGRAM') ||
     upperResponse.includes('INVESTMENT OPPORTUNITY') ||
     upperResponse.includes('HIGH RETURN') ||
     upperResponse.includes('EXCLUSIVE ACCESS') ||
     upperResponse.includes('FINANCIAL ADVISOR') && upperResponse.includes('SPECIAL')) ||
     (upperResponse.includes('QUALIFY') && upperResponse.includes('PROGRAM'));
                                     
  // If it contains financial scam indicators, always mark as scam
  if (containsFinancialScamIndicators) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
    explanation = "This message appears to be a financial scam attempting to collect banking details under false pretenses or creating urgency to transfer funds.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Enhanced detection for indirect financial questions and implicit solicitations
  const containsIndirectFinancialSolicitation = 
    (upperResponse.includes('INVESTMENT PROGRAM') || 
     upperResponse.includes('GUARANTEED') && upperResponse.includes('RETURNS') ||
     upperResponse.includes('EXCLUSIVE') && upperResponse.includes('INVESTMENT') ||
     upperResponse.includes('SELECT CLIENTS') ||
     upperResponse.includes('OFFERING') && upperResponse.includes('ACCESS') ||
     upperResponse.includes('LEARN MORE ABOUT THIS OPPORTUNITY') ||
     upperResponse.includes('PREMIUM') && upperResponse.includes('PROGRAM') ||
     upperResponse.includes('EXCLUSIVE') && upperResponse.includes('OPPORTUNITY') ||
     upperResponse.includes('NOT AVAILABLE TO THE GENERAL PUBLIC') ||
     upperResponse.includes('WEALTH-BUILDING OPPORTUNITIES') ||
     upperResponse.includes('GUARANTEED') && upperResponse.includes('APY') ||
     upperResponse.includes('WOULD YOU LIKE TO') && (
       upperResponse.includes('INVESTMENT') || 
       upperResponse.includes('FINANCIAL') || 
       upperResponse.includes('MONEY') || 
       upperResponse.includes('OPPORTUNITY')
     ));
     
  // Flag indirect financial solicitations as suspicious
  if (containsIndirectFinancialSolicitation) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
    explanation = "This message contains indirect financial solicitation with promises of exclusive investment opportunities or guaranteed returns, which are common in financial scams.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // If it's a simple message pattern without suspicious indicators, override to safe
  if (containsCommonSafe && !containsFinancialScamIndicators && !containsIndirectFinancialSolicitation && aiResponse.length < 150) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
    explanation = "This is a standard chat message with no suspicious elements.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Check for scam indicators - these are strong indicators even in mixed text
  if ((upperResponse.includes('CREDIT CARD') && upperResponse.includes('VERIFY')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('VERIFY') && upperResponse.includes('URGENT')) ||
      (upperResponse.includes('HTTP://VERIFY') || upperResponse.includes('HTTP://BANK')) ||
      (upperResponse.includes('SOCIAL SECURITY') || upperResponse.includes('SSN')) ||
      (upperResponse.includes('DATE OF BIRTH') && upperResponse.includes('VERIFICATION')) ||
      (upperResponse.includes('EXPIRES TODAY') || upperResponse.includes('24 HOURS')) ||
      (upperResponse.includes('EXCLUSIVE') && upperResponse.includes('OPPORTUNITY')) ||
      (upperResponse.includes('GUARANTEED') && upperResponse.includes('RETURN'))) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
    explanation = "This message contains typical scam patterns requesting financial verification, personal information, or creating false urgency.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Check for suspicious patterns that might be part of a scam sequence
  if ((upperResponse.includes('WHICH BANK') || upperResponse.includes('PREFERRED PAYMENT METHOD')) ||
      (upperResponse.includes('PROVIDE') && 
       (upperResponse.includes('DETAILS') || 
        upperResponse.includes('INFORMATION') || 
        upperResponse.includes('NUMBER'))) ||
      (upperResponse.includes('FINANCIAL') && upperResponse.includes('OPPORTUNITY')) ||
      (upperResponse.includes('ADVISOR') && upperResponse.includes('HELP'))) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
    explanation = "This message appears to be gathering sensitive information which could be part of a multi-stage scam.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Standard classification parsing
  if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high'; 
  } else if (upperResponse.includes('RESULT: SCAM')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (upperResponse.includes('RESULT: SUSPICIOUS')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'medium';
  } else if (upperResponse.includes('RESULT: SAFE')) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
  }

  // Extract explanation (everything after the first result line)
  const resultPattern = /RESULT:\s*(SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i;
  const resultMatch = aiResponse.match(resultPattern);
  
  if (resultMatch) {
    const resultIndex = aiResponse.indexOf(resultMatch[0]);
    const afterResult = aiResponse.substring(resultIndex + resultMatch[0].length).trim();
    explanation = afterResult;
  } else {
    explanation = aiResponse.trim();
  }

  // Ensure explanation isn't too long
  if (explanation.length > 200) {
    explanation = explanation.substring(0, 200) + "...";
  }

  return { riskLevel, confidenceLevel, explanation };
}

/**
 * Helper function to check if a message contains suspicious patterns
 * that would disqualify it from being considered safe despite matching introduction patterns
 */
function containsSuspiciousPatterns(message) {
  const upperMessage = message.toUpperCase();
  return (
    upperMessage.includes('ACCOUNT NUMBER') ||
    upperMessage.includes('CREDIT CARD') ||
    upperMessage.includes('VERIFY') ||
    upperMessage.includes('BANK DETAILS') ||
    upperMessage.includes('PASSWORD') ||
    upperMessage.includes('LOGIN') ||
    upperMessage.includes('URGENT') ||
    upperMessage.includes('LIMITED TIME') ||
    upperMessage.includes('OFFER') && upperMessage.includes('EXPIRES') ||
    upperMessage.includes('GUARANTEED') && upperMessage.includes('RETURNS') ||
    upperMessage.includes('INVESTMENT PROGRAM') ||
    upperMessage.includes('EXCLUSIVE') && upperMessage.includes('OPPORTUNITY')
  );
}
