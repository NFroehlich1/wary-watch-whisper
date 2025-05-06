
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
  Please respond with a structured answer including one of these exact classifications:
  - CLASSIFICATION: SAFE
  - CLASSIFICATION: SUSPICIOUS
  - CLASSIFICATION: HIGH SUSPICION
  - CLASSIFICATION: SCAM

  Then provide a brief analysis of why you classified it this way.
  Use simple markdown formatting.`;
}

/**
 * Constructs a text analysis prompt
 * @param text - The text content to analyze
 * @returns Formatted prompt string
 */
export function buildTextPrompt(text: string): string {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer including one of these exact classifications:
  - CLASSIFICATION: SAFE
  - CLASSIFICATION: SUSPICIOUS
  - CLASSIFICATION: HIGH SUSPICION
  - CLASSIFICATION: SCAM

  Then provide a brief analysis of why you classified it this way.
  Use simple markdown formatting.`;
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
    
    Please answer the following specific question about this analysis very concisely:
    "${question}"
    
    Provide a focused response that directly addresses the question.
    Format your answer using simple markdown if needed.
    Your response must be specific to what was asked and brief (2-3 sentences).
    
    If you cannot answer the question from the given analysis, explain why in 1 sentence.
  `;
}
