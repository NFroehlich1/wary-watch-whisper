
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
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a thorough and detailed justification in English, explaining:
  - Domain reputation and age if relevant
  - URL structure concerns
  - Red flags or safety indicators
  - Potential threats or what makes it safe
  - Specific signs of phishing, if any`;
}

/**
 * Constructs a text analysis prompt
 * @param text - The text content to analyze
 * @returns Formatted prompt string
 */
export function buildTextPrompt(text: string): string {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a detailed and thorough justification in English, explaining:
  - Specific language patterns or psychological tactics used
  - Presence of urgency, threats, or promises
  - Requests for personal information or financial details
  - Grammar, spelling, or formatting that may indicate a scam
  - Context that makes the message safe or suspicious`;
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
    
    Please answer the following specific question about this analysis:
    "${question}"
    
    Provide a detailed, educational response that:
    1. Answers the specific question directly and thoroughly
    2. Explains relevant concepts or terms
    3. References specific aspects of the analyzed content when relevant
    4. Includes concrete examples if applicable
    5. Explains technical details in a way that's easy to understand
    
    If the question asks about specific details that weren't covered in the original analysis,
    make reasonable inferences based on the information provided, but clearly indicate 
    when you're making an inference rather than stating a fact from the analysis.
    
    Format your answer to be informative and educational, focusing specifically on what
    the user asked about.
  `;
}
