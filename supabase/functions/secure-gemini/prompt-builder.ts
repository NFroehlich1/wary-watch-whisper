
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
 * Optimized for faster direct answers
 * Now including the user's emoji reaction if provided
 */
export function buildAnalysisQuestionPrompt(question, content, riskLevel, explanation, userEmoji = null) {
  let prompt = `You are analyzing content classified as: ${riskLevel.toUpperCase()}
  
The content: "${content.substring(0, 200)}${content.length > 200 ? '...' : ''}"
Previous analysis: ${explanation.substring(0, 100)}${explanation.length > 100 ? '...' : ''}`;

  // Include the user's emotional reaction via emoji if available
  if (userEmoji) {
    prompt += `\nUser reaction emoji: ${userEmoji}`;
  }
  
  prompt += `\nQuestion: "${question}"
  
Answer the question directly and briefly (2-3 sentences max). 
No introduction or prefix like "Answer:" needed.`;

  return prompt;
}
