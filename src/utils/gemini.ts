import { Language, RiskLevel } from "../types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export const verifyWithGemini = async (content: string, detectionType: 'url' | 'text', language: Language, apiKey: string): Promise<{
  riskAssessment: RiskLevel;
  explanation: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}> => {
  try {
    // Always use English prompt regardless of the detected language
    let prompt = "";
    if (detectionType === 'url') {
      prompt = getUrlPromptInEnglish(content);
    } else {
      prompt = getTextPromptInEnglish(content);
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
    
    // Extract risk level and confidence from the response
    const riskAssessmentInfo = extractRiskAssessment(aiResponse);
    
    // Get explanation
    const explanation = extractExplanation(aiResponse);

    return {
      riskAssessment: riskAssessmentInfo.riskLevel,
      explanation: explanation,
      confidenceLevel: riskAssessmentInfo.confidenceLevel
    };
  } catch (error) {
    console.error('Error verifying with Gemini:', error);
    return {
      riskAssessment: 'suspicious',
      explanation: 'Could not verify with Gemini AI. Defaulting to suspicious.'
    };
  }
};

// Always request responses in English regardless of input language
const getUrlPromptInEnglish = (url: string): string => {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
};

const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
};

// The below functions are kept for compatibility but will not be used anymore
const getUrlPrompt = (url: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si esta URL es segura, sospechosa o una estafa. URL: "${url}". Por favor, clasifícala como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si cette URL est sûre, suspecte ou une arnaque. URL: "${url}". Veuillez la classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else if (language === 'de') {
    return `Analysieren Sie, ob diese URL sicher, verdächtig oder betrügerisch ist. URL: "${url}". Bitte klassifizieren Sie sie als "safe", "suspicious" oder "scam" und geben Sie eine kurze Begründung an.`;
  } else {
    return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};

const getTextPrompt = (text: string, language: Language): string => {
  if (language === 'es') {
    return `Analiza si este mensaje contiene indicios de estafa, contenido sospechoso o si es seguro. Mensaje: "${text}". Por favor, clasifícalo como "safe", "suspicious" o "scam" y proporciona una breve justificación.`;
  } else if (language === 'fr') {
    return `Analysez si ce message contient des signes d'arnaque, un contenu suspect ou s'il est sûr. Message: "${text}". Veuillez le classer comme "safe", "suspicious" ou "scam" et fournir une brève justification.`;
  } else if (language === 'de') {
    return `Analysieren Sie, ob diese Nachricht Anzeichen für Betrug enthält, verdächtigen Inhalt oder ob sie sicher ist. Nachricht: "${text}". Bitte klassifizieren Sie sie als "safe", "suspicious" oder "scam" und geben Sie eine kurze Begründung an.`;
  } else {
    return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". Please classify it as "safe", "suspicious" or "scam" and provide a brief justification.`;
  }
};

const extractRiskAssessment = (aiResponse: string): { riskLevel: RiskLevel, confidenceLevel?: 'high' | 'medium' | 'low' } => {
  const lowerResponse = aiResponse.toLowerCase();
  
  if (lowerResponse.includes('classification: scam')) {
    return { riskLevel: 'scam', confidenceLevel: 'high' };
  } else if (lowerResponse.includes('classification: high suspicion')) {
    return { riskLevel: 'suspicious', confidenceLevel: 'high' };
  } else if (lowerResponse.includes('classification: suspicious')) {
    return { riskLevel: 'suspicious', confidenceLevel: 'medium' };
  } else if (lowerResponse.includes('classification: safe')) {
    return { riskLevel: 'safe', confidenceLevel: 'high' };
  }
  
  // Default fallback using older detection method
  if (lowerResponse.includes('scam')) {
    return { riskLevel: 'scam' };
  } else if (lowerResponse.includes('suspicious') || lowerResponse.includes('caution')) {
    return { riskLevel: 'suspicious' };
  } else if (lowerResponse.includes('safe')) {
    return { riskLevel: 'safe' };
  }
  
  // Ultimate fallback
  return { riskLevel: 'suspicious', confidenceLevel: 'low' };
};

const extractExplanation = (aiResponse: string): string => {
  // First try to remove the classification header
  const classificationMatch = aiResponse.match(/CLASSIFICATION: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  
  if (classificationMatch) {
    // Get everything after the classification
    const explanationPart = aiResponse.substring(aiResponse.indexOf(classificationMatch[0]) + classificationMatch[0].length).trim();
    if (explanationPart) {
      return explanationPart;
    }
  }
  
  // Fallback to the original extraction method
  const lines = aiResponse.split('\n').filter(line => line.trim());
  
  if (lines.length > 1) {
    return lines.slice(1).join(' ').trim();
  }
  
  return aiResponse;
};
