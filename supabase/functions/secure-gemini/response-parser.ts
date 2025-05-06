
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
  let riskLevel = 'safe'; // Default to 'safe'
  let confidenceLevel = 'medium';
  let explanation = '';

  // Extract classification 
  if (aiResponse.toUpperCase().includes('RESULT: SCAM')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (aiResponse.toUpperCase().includes('RESULT: HIGH SUSPICION')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
  } else if (aiResponse.toUpperCase().includes('RESULT: SUSPICIOUS')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'medium';
  } else if (aiResponse.toUpperCase().includes('RESULT: SAFE')) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
  }

  // Extract explanation (everything after the classification line)
  const resultMatch = aiResponse.match(/RESULT: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  if (resultMatch) {
    explanation = aiResponse.substring(aiResponse.indexOf(resultMatch[0]) + resultMatch[0].length).trim();
  } else {
    explanation = aiResponse;
  }

  return { riskLevel, confidenceLevel, explanation };
}
