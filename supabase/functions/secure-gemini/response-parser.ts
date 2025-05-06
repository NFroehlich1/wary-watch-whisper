
/**
 * Functions for parsing and processing Gemini AI responses
 */

/**
 * Processes the AI response to extract classification information
 * @param aiResponse - The raw response from Gemini
 * @returns Structured response with risk level, confidence, and explanation
 */
export function processAiResponse(aiResponse: string): { 
  riskLevel: string, 
  confidenceLevel: string, 
  explanation: string 
} {
  // Default values
  let riskLevel = 'safe';
  let confidenceLevel = 'medium';
  let explanation = '';

  // Simple string-based detection - case insensitive
  const upperResponse = aiResponse.toUpperCase();
  
  if (upperResponse.includes('RESULT: SCAM')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (upperResponse.includes('RESULT: HIGH SUSPICION')) {
    riskLevel = 'suspicious';
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

  // If explanation is too long, truncate it
  if (explanation.length > 500) {
    explanation = explanation.substring(0, 500) + "...";
  }

  return { riskLevel, confidenceLevel, explanation };
}
