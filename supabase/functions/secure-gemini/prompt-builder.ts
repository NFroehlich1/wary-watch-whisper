
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
  Please respond with a structured markdown answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a concise markdown analysis in this exact format:

  ## 🧠 Quick Analysis

  **🔑 Keywords:** \`keyword_1\`, \`keyword_2\`, \`keyword_3\`  
  **🗣 Common Usage:** Often used to **general_purpose** (e.g. trigger urgency, build trust, mislead).

  **📌 In This Context:**  
  Here, these terms are used to **specific_intent**, likely aiming to **effect_on_reader**.

  **✅ Conclusion:**  
  This language pattern suggests **risk_level**, especially due to **primary_reason**.

  Fill in each placeholder based on your analysis. Keep descriptions brief and to the point.`;
}

/**
 * Constructs a text analysis prompt
 * @param text - The text content to analyze
 * @returns Formatted prompt string
 */
export function buildTextPrompt(text: string): string {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured markdown answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a concise markdown analysis in this exact format:

  ## 🧠 Quick Analysis

  **🔑 Keywords:** \`keyword_1\`, \`keyword_2\`, \`keyword_3\`  
  **🗣 Common Usage:** Often used to **general_purpose** (e.g. trigger urgency, build trust, mislead).

  **📌 In This Context:**  
  Here, these terms are used to **specific_intent**, likely aiming to **effect_on_reader**.

  **✅ Conclusion:**  
  This language pattern suggests **risk_level**, especially due to **primary_reason**.

  Fill in each placeholder based on your analysis. Keep descriptions brief and to the point.`;
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
