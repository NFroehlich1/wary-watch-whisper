
/**
 * Ultra-simplified prompt builders for the Gemini API
 */

/**
 * Builds a minimal URL analysis prompt
 */
export function buildUrlPrompt(url) {
  return `Analyze if this URL is safe or suspicious or a scam: "${url}". 
  Respond with ONLY one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a very short plain text explanation (max 1-2 sentences).`;
}

/**
 * Builds a minimal text analysis prompt
 */
export function buildTextPrompt(text) {
  return `Analyze if this message is safe or suspicious or a scam: "${text}". 
  Respond with ONLY one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a very short plain text explanation (max 1-2 sentences).`;
}

/**
 * Builds a focused analysis question prompt
 */
export function buildAnalysisQuestionPrompt(question, content, riskLevel, explanation) {
  return `You are analyzing a message or URL: "${content}"
  
  It was classified as: ${riskLevel.toUpperCase()}
  Analysis details: ${explanation}
  
  Now answer this user question: "${question}"
  
  Keep your response VERY focused on specifically answering ONLY what was asked.
  Respond in plain text without any prefix like "Answer:" or "Response:".
  Limit your answer to 3-4 sentences maximum.
  If you don't have enough information, state that directly.`;
}
