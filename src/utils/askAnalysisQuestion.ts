
/**
 * Module for post-analysis evaluation of assessment results
 * Enables users to ask questions about assessment results
 */
import { ScamResult, GeminiOptions } from '../types';
import { supabase } from "../integrations/supabase/client";

/**
 * Constants for error messages and defaults
 */
const ERROR_MESSAGES = {
  DISABLED: "AI analysis is not enabled. Enable it in settings to ask questions about the analysis.",
  API_ERROR: "I couldn't answer this question at the moment. Please try again later.",
  NO_ANSWER: "I couldn't generate an answer to your question."
};

/**
 * Asks a question about an analysis result to the Gemini AI
 * @param question - The question to ask
 * @param result - The scam detection result
 * @param geminiOptions - Configuration for the Gemini AI
 * @returns The answer to the question
 */
export const askAnalysisQuestion = async (
  question: string, 
  result: ScamResult, 
  geminiOptions: GeminiOptions
): Promise<string> => {
  if (!geminiOptions.enabled) {
    return ERROR_MESSAGES.DISABLED;
  }
  
  try {
    const prompt = buildAnalysisPrompt(question, result);
    
    console.log("Sending analysis question to Gemini:", question);
    
    // Call our secure Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('secure-gemini', {
      body: {
        content: prompt,
        detectionType: 'text',
        language: 'en'
      }
    });
    
    if (error) {
      console.error("Error asking analysis question:", error);
      throw new Error(`Failed to get analysis answer: ${error.message}`);
    }
    
    if (!data || !data.explanation) {
      console.error("Empty response from Gemini API");
      return ERROR_MESSAGES.NO_ANSWER;
    }
    
    // Process the response to extract just the answer part
    const response = data.explanation;
    console.log("Raw answer from Gemini:", response);
    
    // Return the cleaned-up answer, removing any system prompt or classification parts
    const cleanedAnswer = cleanAnswerText(response);
    
    // Make sure we never return empty answers
    if (!cleanedAnswer || cleanedAnswer.trim() === "") {
      return "This content was classified as " + result.riskLevel + 
        (result.confidenceLevel ? ` with ${result.confidenceLevel} confidence` : "") + 
        ". " + result.justification.substring(0, 100) + "...";
    }
    
    return cleanedAnswer;
  } catch (error) {
    console.error("Error asking analysis question:", error);
    return ERROR_MESSAGES.API_ERROR;
  }
};

/**
 * Cleans up the answer text by removing system prompts or classification prefixes
 */
function cleanAnswerText(text: string): string {
  // If text is empty or undefined, return empty string
  if (!text) return "";
  
  // Remove any analysis instruction text that might have been echoed back
  let cleanText = text;
  
  // Check if the response contains any of our prompt text and remove it
  if (text.includes("Answer the following question:")) {
    const parts = text.split("Answer the following question:");
    if (parts.length > 1) {
      // Get the part after the prompt
      const afterPrompt = parts[1].trim();
      
      // Look for the question in the response
      const questionStart = afterPrompt.indexOf("?");
      if (questionStart > 0 && questionStart < 100) { // Only if question mark is near the start
        cleanText = afterPrompt.substring(questionStart + 1).trim();
      } else {
        cleanText = afterPrompt;
      }
    }
  }
  
  // If there's a clear answer section, extract just that
  const answerSectionMatch = cleanText.match(/^.*?(answer|response):\s*([\s\S]+)$/i);
  if (answerSectionMatch) {
    cleanText = answerSectionMatch[2].trim();
  }
  
  // Remove any quotation marks that might be wrapping the actual question
  cleanText = cleanText.replace(/^['"](.+)['"]\s*/, '');
  
  // If the answer is still empty after cleaning, return the original text
  return cleanText.trim() || text;
}

/**
 * Builds a prompt for the analysis question
 * @param question - The question to ask
 * @param result - The scam detection result
 * @returns Formatted prompt string
 */
function buildAnalysisPrompt(question: string, result: ScamResult): string {
  const analysisContext = `
    - Risk level: ${result.riskLevel}${result.confidenceLevel ? ` (${result.confidenceLevel} confidence)` : ''}
    - Justification: ${result.justification}
    - Original content: "${result.originalContent}"
  `;
  
  return `
    I analyzed a message or URL with the following details:
    ${analysisContext}
    
    Please answer the following specific question about this analysis very concisely:
    "${question}"
    
    Provide a brief, focused response that:
    1. Answers the specific question directly in 1-2 sentences
    2. Explains only the most critical information related to the question
    3. Keeps technical details simple and short
    
    Your response must be specific to the question asked, but extremely concise.
    The entire response should be 2-3 sentences maximum. Be direct and to the point.
  `;
}
