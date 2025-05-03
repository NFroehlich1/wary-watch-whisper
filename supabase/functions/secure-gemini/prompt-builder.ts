
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
  
  Then provide a brief justification in English.`;
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
  
  Then provide a brief justification in English.`;
}
