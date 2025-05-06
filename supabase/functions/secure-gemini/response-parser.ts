
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
  
  // Check for HIGH SUSPICION first (more specific than just SUSPICIOUS)
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
