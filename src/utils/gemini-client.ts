
/**
 * Client für die Gemini AI API
 * Stellt eine Schnittstelle zur Verfügung, um verschiedene Inhalte zu verifizieren
 */
import { Language, RiskLevel } from "../types";
import { supabase } from "../integrations/supabase/client";

/**
 * Verifiziert Inhalte mithilfe der Gemini AI über eine Supabase Edge Function
 * @param content - Der zu verifizierende Inhalt (URL oder Text)
 * @param detectionType - Art des Inhalts (URL oder Text)
 * @param language - Sprache des Inhalts zur besseren Analyse
 * @returns Bewertung des Inhalts mit Risikostufe und Erklärung
 */
export const verifyWithGemini = async (content: string, detectionType: 'url' | 'text', language: Language): Promise<{
  riskAssessment: RiskLevel;
  explanation: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}> => {
  try {
    // Call the secure Supabase Edge Function instead of the Gemini API directly
    const { data, error } = await supabase.functions.invoke('secure-gemini', {
      body: { content, detectionType, language }
    });
    
    if (error) {
      console.error('Error calling secure-gemini function:', error);
      throw new Error(`Failed to verify content: ${error.message}`);
    }
    
    return {
      riskAssessment: data.riskAssessment,
      explanation: data.explanation,
      confidenceLevel: data.confidenceLevel
    };
  } catch (error) {
    console.error('Error verifying with secure Gemini function:', error);
    return {
      riskAssessment: 'suspicious',
      explanation: 'Could not verify with Gemini AI. Defaulting to suspicious.',
      confidenceLevel: 'low'
    };
  }
};
