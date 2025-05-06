
/**
 * Client für die Gemini AI API
 * Stellt eine Schnittstelle zur Verfügung, um verschiedene Inhalte zu verifizieren
 */
import { Language, RiskLevel } from "../types";
import { supabase } from "../integrations/supabase/client";

// Typdefinition für Verifikationsergebnisse
export interface VerificationResult {
  riskAssessment: RiskLevel;
  explanation: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

// Typdefinition für Jobstatus
export interface JobStatus {
  status: 'pending' | 'completed' | 'failed';
  result?: VerificationResult;
  error?: string;
}

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
    // Aufruf der sicheren Supabase Edge Function, um den Job zu starten
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
    throw new Error(`Failed to start verification job: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Ruft den Status eines Verifikationsjobs ab
 * @param jobId - Die Job-ID der Verifikationsanfrage
 * @returns Status und Ergebnis des Jobs
 */
export const getVerificationResult = async (jobId: string): Promise<JobStatus> => {
  try {
    // Aufruf der sicheren Supabase Edge Function mit der Job-ID als Parameter
    const { data, error } = await supabase.functions.invoke(
      'secure-gemini/job-status',
      { 
        method: 'GET',
        // Fix: Using params instead of query for passing parameters
        params: { jobId }
      }
    );
    
    if (error) {
      console.error('Error calling job-status function:', error);
      return {
        status: 'failed',
        error: `Failed to get job status: ${error.message}`
      };
    }

    // Map the database response to our JobStatus interface
    return {
      status: data.status,
      result: data.result,
      error: data.error
    };
  } catch (error) {
    console.error('Error getting verification result:', error);
    return {
      status: 'failed',
      error: `Failed to get verification result: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
