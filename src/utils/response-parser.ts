
/**
 * Modul zur Verarbeitung und Analyse von KI-Antworten
 */
import { RiskLevel } from "../types";

/**
 * Extrahiert die Risikobewertung aus der KI-Antwort
 * @param aiResponse - Die KI-Antwort als Text
 * @returns Risikostufe und Vertrauensniveau
 */
export const extractRiskAssessment = (aiResponse: string): { 
  riskLevel: RiskLevel, 
  confidenceLevel?: 'high' | 'medium' | 'low' 
} => {
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

/**
 * Extrahiert die Erklärung aus der KI-Antwort
 * @param aiResponse - Die KI-Antwort als Text
 * @returns Die extrahierte Erklärung
 */
export const extractExplanation = (aiResponse: string): string => {
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
