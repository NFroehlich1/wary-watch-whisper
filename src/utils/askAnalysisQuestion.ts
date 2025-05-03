
import { ScamResult, GeminiOptions } from '../types';

export const askAnalysisQuestion = async (
  question: string, 
  result: ScamResult, 
  geminiOptions: GeminiOptions
): Promise<string> => {
  if (!geminiOptions.enabled || !geminiOptions.apiKey) {
    return "AI analysis is not enabled. Enable it in settings to ask questions about the analysis.";
  }
  
  try {
    // Format the prompt for the AI
    const prompt = `
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
    
    // Call the Gemini API with the prompt
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiOptions.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                    "I couldn't generate an answer to your question.";
    
    return answer;
  } catch (error) {
    console.error("Error asking analysis question:", error);
    return "I couldn't answer this question at the moment. Please try again later.";
  }
};
