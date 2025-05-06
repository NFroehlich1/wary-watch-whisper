
/**
 * Functions for parsing and processing Gemini AI responses
 */

/**
 * Processes the AI response to extract classification information
 * @param aiResponse - The raw response from Gemini
 * @returns Structured response with risk level, confidence, and explanation
 */
export function processAiResponse(aiResponse: string): { 
  riskLevel: string, 
  confidenceLevel: string, 
  explanation: string 
} {
  let riskLevel = 'safe'; // Default to 'safe'
  let confidenceLevel = 'medium';
  let explanation = '';

  // Check if this is an analysis question response rather than a classification
  if (aiResponse.includes("Answer the following question:") || 
      aiResponse.toLowerCase().includes("question:") ||
      !aiResponse.toLowerCase().includes("classification:")) {
    // This is likely a response to a question, not a classification
    explanation = aiResponse;
    
    // Clean up the explanation from any prompt repetition
    explanation = cleanAnalysisQuestionResponse(explanation);
    
    // Make sure we don't return an empty explanation
    if (!explanation.trim()) {
      explanation = "I don't have enough information to answer this specific question about the analysis. Could you try asking something more specific about the content being analyzed?";
    }
    
    return { riskLevel, confidenceLevel, explanation };
  }

  // Extract classification and confidence level - be very conservative with "suspicious" classifications
  if (aiResponse.toLowerCase().includes('classification: scam')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (aiResponse.toLowerCase().includes('classification: high suspicion')) {
    // Only classify as high suspicion if explicitly stated
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
  } else if (
    aiResponse.toLowerCase().includes('classification: suspicious') &&
    (aiResponse.toLowerCase().includes('urgent') && 
     (aiResponse.toLowerCase().includes('password') ||
      aiResponse.toLowerCase().includes('credential') ||
      aiResponse.toLowerCase().includes('bank details')))
  ) {
    // Only classify as suspicious if multiple high-risk indicators are present
    riskLevel = 'suspicious';
    confidenceLevel = 'medium';
  } else if (aiResponse.toLowerCase().includes('classification: safe')) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
  } else {
    // If classification is unclear, default to safe
    riskLevel = 'safe';
    confidenceLevel = 'low';
  }

  // Extract explanation (everything after the classification line)
  const classificationMatch = aiResponse.match(/CLASSIFICATION: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  if (classificationMatch) {
    explanation = aiResponse.substring(aiResponse.indexOf(classificationMatch[0]) + classificationMatch[0].length).trim();
  } else {
    explanation = aiResponse;
  }

  return { riskLevel, confidenceLevel, explanation };
}

/**
 * Cleans up analysis question responses by removing prompt repetition
 * and extracting the most relevant part of the answer
 * @param response - The raw response from the AI
 * @returns A cleaned response
 */
function cleanAnalysisQuestionResponse(response: string): string {
  // Remove any sections that repeat the question or prompt
  let cleanedResponse = response;
  
  // Remove any system instructions that might have been echoed back
  const promptMarkers = [
    "I analyzed content with the following details:",
    "Please answer the following specific question",
    "Provide a brief, focused response",
    "Format your answer to be",
    "Please answer the following question:"
  ];
  
  for (const marker of promptMarkers) {
    if (cleanedResponse.includes(marker)) {
      // Find the position after the marker and any subsequent instructions
      const markerPos = cleanedResponse.indexOf(marker);
      // Look for the end of the instructions section
      const possibleEndMarkers = ["\n\n", "\nAnswer:", "\nResponse:"];
      let endPos = -1;
      
      for (const endMarker of possibleEndMarkers) {
        const tempEndPos = cleanedResponse.indexOf(endMarker, markerPos + marker.length);
        if (tempEndPos !== -1 && (endPos === -1 || tempEndPos < endPos)) {
          endPos = tempEndPos + endMarker.length;
        }
      }
      
      if (endPos !== -1) {
        cleanedResponse = cleanedResponse.substring(endPos).trim();
      }
    }
  }
  
  // If the response starts with "Answer:" or similar, remove that prefix
  cleanedResponse = cleanedResponse.replace(/^(Answer|Response):\s*/i, '');
  
  // If the original question is repeated, remove it
  const questionMatch = cleanedResponse.match(/^("[^"]+"|'[^']+'|[^.,!?:;]+\?)\s*/);
  if (questionMatch) {
    cleanedResponse = cleanedResponse.substring(questionMatch[0].length).trim();
  }
  
  return cleanedResponse;
}
