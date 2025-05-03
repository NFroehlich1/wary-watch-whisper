
/**
 * Functions for parsing and processing Gemini API responses
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
  let riskLevel = 'safe'; // Changed default from 'suspicious' to 'safe'
  let confidenceLevel = 'medium';
  let explanation = '';

  // Extract classification and confidence level - be more conservative with "suspicious" classifications
  if (aiResponse.toLowerCase().includes('classification: scam')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (aiResponse.toLowerCase().includes('classification: high suspicion')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
  } else if (
    aiResponse.toLowerCase().includes('classification: suspicious') &&
    (aiResponse.toLowerCase().includes('urgent') || 
     aiResponse.toLowerCase().includes('password') ||
     aiResponse.toLowerCase().includes('credential') ||
     aiResponse.toLowerCase().includes('bank details'))
  ) {
    // Only classify as suspicious if specific high-risk words are present
    riskLevel = 'suspicious';
    confidenceLevel = 'medium';
  } else if (aiResponse.toLowerCase().includes('classification: safe')) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
  } else {
    // If classification is unclear, default to safe
    riskLevel = 'safe';
    confidenceLevel = 'medium';
  }

  // Extract explanation (everything after the classification line)
  const classificationMatch = aiResponse.match(/CLASSIFICATION: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  if (classificationMatch) {
    explanation = aiResponse.substring(aiResponse.indexOf(classificationMatch[0]) + classificationMatch[0].length).trim();
  } else {
    explanation = aiResponse;
  }

  return { riskLevel, confidenceLevel, explanation };
}
