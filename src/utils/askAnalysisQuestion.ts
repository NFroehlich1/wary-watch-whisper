
/**
 * Modul zur nachträglichen Analyse von Bewertungsergebnissen
 * Ermöglicht Benutzern, Fragen zu Bewertungsergebnissen zu stellen
 */
import { ScamResult, GeminiOptions } from '../types';
import { supabase } from "../integrations/supabase/client";

/**
 * Konstanten für Fehlermeldungen und Standards
 */
const ERROR_MESSAGES = {
  DISABLED: "AI analysis is not enabled. Enable it in settings to ask questions about the analysis.",
  API_ERROR: "I couldn't answer this question at the moment. Please try again later.",
  NO_ANSWER: "I couldn't generate an answer to your question."
};

/**
 * Stellt eine Frage zur Analyse eines Ergebnisses an die Gemini AI
 * @param question - Die zu stellende Frage
 * @param result - Das Ergebnis der Scam-Erkennung
 * @param geminiOptions - Konfiguration für die Gemini AI
 * @returns Die Antwort auf die Frage
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
    return cleanedAnswer || ERROR_MESSAGES.NO_ANSWER;
  } catch (error) {
    console.error("Error asking analysis question:", error);
    return ERROR_MESSAGES.API_ERROR;
  }
};

/**
 * Cleans up the answer text by removing system prompts or classification prefixes
 */
function cleanAnswerText(text: string): string {
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
  
  return cleanText;
}

/**
 * Baut einen Prompt für die Analyse-Frage
 * @param question - Die zu stellende Frage
 * @param result - Das Ergebnis der Scam-Erkennung
 * @returns Formatierter Prompt-String
 */
function buildAnalysisPrompt(question: string, result: ScamResult): string {
  return `
    I analyzed a message or URL with the following details:
    - Risk level: ${result.riskLevel}${result.confidenceLevel ? ` (${result.confidenceLevel} confidence)` : ''}
    - Justification: ${result.justification}
    - Original content: "${result.originalContent}"
    
    Answer the following question:
    ${question}
    
    Your response must:
    1. If the question is related to the analysis, provide a helpful answer
    2. If the question is not related to the analysis, respond that you can only answer questions about this specific analysis
    3. Never provide information about how to create scams
    4. Never provide harmful or misleading information
    5. Be factual and educational in nature
    6. Be concise and direct
    7. If asked about anything unrelated to fraud detection, scams, or this specific analysis, politely explain you can only discuss this specific analysis
  `;
}
