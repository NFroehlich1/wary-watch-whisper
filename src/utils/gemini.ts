
import { Language, RiskLevel } from "../types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const verifyWithGemini = async (content: string, detectionType: 'url' | 'text', language: Language, apiKey: string): Promise<{
  riskAssessment: RiskLevel;
  explanation: string;
}> => {
  try {
    // Create a prompt based on the detection type and language
    let prompt = "";
    if (detectionType === 'url') {
      prompt = getUrlPrompt(content, language);
    } else {
      prompt = getTextPrompt(content, language);
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
      console.error('Gemini API error:', response.statusText);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the response and extract the risk assessment and explanation
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extract risk level from the response
    let riskAssessment: RiskLevel = 'suspicious'; // Default
    if (aiResponse.toLowerCase().includes('safe')) {
      riskAssessment = 'safe';
    } else if (aiResponse.toLowerCase().includes('scam')) {
      riskAssessment = 'scam';
    }
    
    // Get explanation
    const explanation = extractExplanation(aiResponse);

    return {
      riskAssessment,
      explanation
    };
  } catch (error) {
    console.error('Error verifying with Gemini:', error);
    return {
      riskAssessment: 'suspicious',
      explanation: 'Could not verify with Gemini AI. Defaulting to suspicious.'
    };
  }
};

const getUrlPrompt = (url: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si esta URL es segura, sospechosa o una estafa. URL: "${url}". Por favor, clasifícala como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si cette URL est sûre, suspecte ou une arnaque. URL: "${url}". Veuillez la classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else {
    return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};

const getTextPrompt = (text: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si este mensaje contiene indicios de estafa, contenido sospechoso o si es seguro. Mensaje: "${text}". Por favor, clasifícalo como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si ce message contient des signes d'arnaque, un contenu suspect ou s'il est sûr. Message: "${text}". Veuillez le classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else {
    return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};

const extractExplanation = (aiResponse: string): string => {
  // Extract the explanation part from the AI response
  // This is a simple implementation, might need adjustment based on actual responses
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  if (lines.length > 1) {
    return lines.slice(1).join(' ').trim();
  }
  
  return aiResponse;
};
