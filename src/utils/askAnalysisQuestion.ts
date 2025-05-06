
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
    
    if (!data || !data.jobId) {
      console.error("Invalid response format from Gemini API");
      return ERROR_MESSAGES.NO_ANSWER;
    }
    
    // Now poll for the result using the job ID
    const jobId = data.jobId;
    let jobComplete = false;
    let attempts = 0;
    let maxAttempts = 10;
    
    while (!jobComplete && attempts < maxAttempts) {
      attempts++;
      // Wait 1 second between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: jobData, error: jobError } = await supabase.functions.invoke(
        'secure-gemini/job-status',
        { 
          method: 'GET',
          // Fix: Using params instead of query for passing parameters
          params: { jobId }
        }
      );
      
      if (jobError) {
        console.error("Error checking job status:", jobError);
        continue;
      }
      
      if (jobData.status === 'completed' && jobData.result) {
        jobComplete = true;
        const response = jobData.result.explanation;
        console.log("Raw answer from Gemini:", response);
        
        // Return the cleaned-up answer
        const cleanedAnswer = cleanAnswerText(response);
        return cleanedAnswer || ERROR_MESSAGES.NO_ANSWER;
      } else if (jobData.status === 'failed') {
        console.error('Gemini verification failed:', jobData.error);
        break;
      }
    }
    
    if (!jobComplete) {
      console.error("Job timed out");
      return ERROR_MESSAGES.API_ERROR;
    }
    
    return ERROR_MESSAGES.NO_ANSWER;
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
    "CLASSIFICATION:"
  ];
  
  for (const marker of promptMarkers) {
    if (cleanText.includes(marker)) {
      // Find the position after the marker and any subsequent instructions
      const markerPos = cleanText.indexOf(marker);
      // Look for the end of the instructions section
      const possibleEndMarkers = ["\n\n", "\nAnswer:", "\nResponse:"];
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
  
  // Make sure markdown formatting is preserved
  return cleanText;
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
    
    Provide a focused response that directly addresses the question.
    Format your answer using proper markdown formatting.
    Use **bold** or *italic* text to highlight important points.
    Your response must be specific to what was asked and brief (2-3 sentences).
    
    If you cannot answer the question from the given analysis, explain why in 1 sentence.
  `;
}
