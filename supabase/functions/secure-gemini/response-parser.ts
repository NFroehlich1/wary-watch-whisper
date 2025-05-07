
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
  
  // Check for common greeting patterns that should always be classified as safe
  const commonSafeMessages = /\b(THANKS|THANK YOU|HELLO|HI|HEY|GREETING|HOW ARE YOU|OK|YES|NO|SURE|COOL|GREAT|NICE TO (MEET|CHAT))\b/i;
  const containsCommonSafe = commonSafeMessages.test(aiResponse);
  
  // Check for suspicious indicators even if common safe words exist
  const containsFinancialScamIndicators = 
    (upperResponse.includes('BANKING PLATFORM') || 
     upperResponse.includes('BETTER RATES') || 
     upperResponse.includes('SHARE') && upperResponse.includes('BANK DETAILS') ||
     upperResponse.includes('CURRENT BANK') ||
     upperResponse.includes('SAVE MONEY') && upperResponse.includes('BANK'));
                                     
  // If it contains financial scam indicators, always mark as scam
  if (containsFinancialScamIndicators) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
    explanation = "This message appears to be a financial scam attempting to collect banking details under false pretenses.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // If it's a simple message pattern without suspicious indicators, override to safe
  if (containsCommonSafe && !containsFinancialScamIndicators && aiResponse.length < 150) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
    explanation = "This is a standard chat message with no suspicious elements.";
    return { riskLevel, confidenceLevel, explanation };
  }
  
  // Check for scam indicators - these are strong indicators even in mixed text
  if ((upperResponse.includes('CREDIT CARD') && upperResponse.includes('VERIFY')) ||
      (upperResponse.includes('BANK') && upperResponse.includes('VERIFY') && upperResponse.includes('URGENT')) ||
      (upperResponse.includes('HTTP://VERIFY') || upperResponse.includes('HTTP://BANK'))) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
    explanation = "This message contains typical scam patterns requesting financial verification or urgent banking action.";
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
