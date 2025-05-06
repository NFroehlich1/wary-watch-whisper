
/**
 * Functions for building prompts for the Gemini API
 */

/**
 * Constructs a URL analysis prompt
 * @param url - The URL to analyze
 * @returns Formatted prompt string
 */
export function buildUrlPrompt(url: string): string {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS 
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
}

/**
 * Constructs a text analysis prompt
 * @param text - The text content to analyze
 * @returns Formatted prompt string
 */
export function buildTextPrompt(text: string): string {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
}

/**
 * Builds a detailed analysis question prompt
 * This is used when the user asks specific questions about an analysis
 * @param question - The user's question
 * @param analysisContext - The context of the original analysis
 * @returns Formatted question prompt
 */
export function buildAnalysisQuestionPrompt(question: string, analysisContext: string): string {
  return `
    I analyzed content with the following details:
    ${analysisContext}
    
    Please answer this question: "${question}"
    
    Keep your answer very brief (1-2 sentences).
  `;
}
