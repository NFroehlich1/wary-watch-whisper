
/**
 * Client für die Gemini AI API
 * Stellt eine Schnittstelle zur Verfügung, um verschiedene Inhalte zu verifizieren
 */
import { Language, RiskLevel } from "../types";
import { supabase } from "../integrations/supabase/client";

/**
 * Startet eine asynchrone Verifizierung von Inhalten über die Gemini AI
 * @param content - Der zu verifizierende Inhalt (URL oder Text)
 * @param detectionType - Art des Inhalts (URL oder Text)
 * @param language - Sprache des Inhalts zur besseren Analyse
 * @returns JobID für die spätere Abfrage des Ergebnisses
 */
export const verifyWithGemini = async (content: string, detectionType: 'url' | 'text', language: Language): Promise<{
  jobId: string;
}> => {
  try {
    // Call the secure Supabase Edge Function to start the job
    const { data, error } = await supabase.functions.invoke('secure-gemini', {
      body: { content, detectionType, language }
    });
    
    if (error) {
      console.error('Error calling secure-gemini function:', error);
      throw new Error(`Failed to verify content: ${error.message}`);
    }
    
    return {
      jobId: data.jobId
    };
  } catch (error) {
    console.error('Error verifying with secure Gemini function:', error);
    throw new Error(`Failed to start verification job: ${error.message}`);
  }
};

/**
 * Ruft das Ergebnis eines Verifikationsjobs ab
 * @param jobId - Die Job-ID der Verifikationsanfrage
 * @returns Status und Ergebnis des Jobs
 */
export const getVerificationResult = async (jobId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  result?: {
    riskAssessment: RiskLevel;
    explanation: string;
    confidenceLevel?: 'high' | 'medium' | 'low';
  };
  error?: string;
}> => {
  try {
    // Call the secure Supabase Edge Function to get the job status
    // Fix: use query string approach instead of queryParams which doesn't exist
    const { data, error } = await supabase.functions.invoke(`secure-gemini/job-status?jobId=${jobId}`, {
      body: {},
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (error) {
      console.error('Error calling job-status function:', error);
      return {
        status: 'failed',
        error: `Failed to get job status: ${error.message}`
      };
    }
    
    return {
      status: data.status,
      result: data.result,
      error: data.error
    };
  } catch (error) {
    console.error('Error getting verification result:', error);
    return {
      status: 'failed',
      error: `Failed to get verification result: ${error.message}`
    };
  }
};
