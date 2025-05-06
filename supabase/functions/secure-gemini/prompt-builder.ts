
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
 * Builds a specialized prompt for voice message transcriptions
 * This is more focused on phone scams and voice-specific threats
 */
export function buildVoicePrompt(transcription) {
  return `Analyze this voice message transcription for signs of a scam, fraud or social engineering: "${transcription}".
  
  Pay special attention to:
  - Urgency or pressure tactics ("act now", "immediate action required")
  - Requests for personal information (account details, passwords, SSN)
  - Claims to be from banks, government agencies, or tech companies
  - Warnings about accounts being compromised or legal consequences
  - Suspicious callback numbers or unusual payment methods mentioned
  - Offers that sound too good to be true
  
  Respond with ONLY one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a very short plain text explanation (max 1-2 sentences) focusing on why you made this determination.`;
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
