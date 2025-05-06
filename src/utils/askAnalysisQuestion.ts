
/**
 * Module for post-analysis evaluation of assessment results
 * Enables users to ask questions about assessment results
 */
import { ScamResult, GeminiOptions } from '../types';
import { supabase } from "../integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getAnalysisQuestionPrompt } from "./prompt-builder";

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
 * OPTIMIZED: Uses direct question endpoint for faster responses
 * 
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
    console.log("Sending analysis question directly to Gemini:", question);
    
    // Call the new direct endpoint for immediate answers without job creation/polling
    const { data, error } = await supabase.functions.invoke('secure-gemini/direct-question', {
      body: {
        question,
        content: result.originalContent,
        riskLevel: result.riskLevel,
        explanation: result.justification || result.aiVerification || ""
      }
    });
    
    if (error) {
      console.error("Error asking analysis question:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to get analysis answer. Please try again later.",
        variant: "destructive"
      });
      throw new Error(`Failed to get analysis answer: ${error.message}`);
    }
    
    if (!data || !data.answer) {
      console.error("Invalid response format from direct question API");
      toast({
        title: "Analysis Error",
        description: "Invalid response from AI service.",
        variant: "destructive"
      });
      return ERROR_MESSAGES.NO_ANSWER;
    }
    
    // Return the cleaned-up answer directly - no more polling!
    console.log("Direct answer from Gemini:", data.answer.substring(0, 100) + (data.answer.length > 100 ? '...' : ''));
    const cleanedAnswer = cleanAnswerText(data.answer);
    return cleanedAnswer || ERROR_MESSAGES.NO_ANSWER;
    
  } catch (error) {
    console.error("Error asking analysis question:", error);
    
    // Extract any useful information from the original result
    const fallbackAnswer = extractQuickAnalysisFromResult(result);
    if (fallbackAnswer) {
      return `Based on the analysis: ${fallbackAnswer}`;
    }
    
    return ERROR_MESSAGES.API_ERROR;
  }
};

/**
 * Extract quick analysis information from result for fallback responses
 */
function extractQuickAnalysisFromResult(result: ScamResult): string {
  const justificationText = result.aiVerification || result.justification || '';
  
  // Look for the Quick Analysis section in the justification
  if (justificationText.includes('🧠 Quick Analysis')) {
    return justificationText
      .split('## 🧠 Quick Analysis')[1]
      .split('##')[0]
      .trim();
  }
  
  return '';
}

/**
 * Cleans up the answer text by removing system prompts or classification prefixes
 */
function cleanAnswerText(text: string): string {
  // If text is empty or undefined, return empty string
  if (!text) return "";
  
  // Remove any analysis instruction text that might have been echoed back
  let cleanText = text;
  
  // Remove any system instructions that might have been echoed back
  const promptMarkers = [
    "I analyzed content with the following details:",
    "Please answer the following specific question",
    "Provide a brief, focused response",
    "Format your answer to be",
    "Please answer the following question:",
    "CLASSIFICATION:",
    "RESULT:"
  ];
  
  for (const marker of promptMarkers) {
    if (cleanText.includes(marker)) {
      // Find the position after the marker and any subsequent instructions
      const markerPos = cleanText.indexOf(marker);
      // Look for the end of the instructions section
      const possibleEndMarkers = ["\n\n", "\nAnswer:", "\nResponse:", "\n\nThe content"];
      let endPos = -1;
      
      for (const endMarker of possibleEndMarkers) {
        const tempEndPos = cleanText.indexOf(endMarker, markerPos + marker.length);
        if (tempEndPos !== -1 && (endPos === -1 || tempEndPos < endPos)) {
          endPos = tempEndPos + endMarker.length;
        }
      }
      
      if (endPos !== -1) {
        cleanText = cleanText.substring(endPos).trim();
      }
    }
  }
  
  // If the response starts with "Answer:" or similar, remove that prefix
  cleanText = cleanText.replace(/^(Answer|Response):\s*/i, '');
  
  // If the original question is repeated, remove it
  const questionMatch = cleanText.match(/^("[^"]+"|'[^']+'|[^.,!?:;]+\?)\s*/);
  if (questionMatch) {
    cleanText = cleanText.substring(questionMatch[0].length).trim();
  }
  
  return cleanText;
}
