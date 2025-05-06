
/**
 * Client für die Gemini AI API
 * Stellt eine Schnittstelle zur Verfügung, um verschiedene Inhalte zu verifizieren
 */
import { Language, RiskLevel } from "../types";
import { supabase } from "../integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
    console.log(`Starting Gemini verification for ${detectionType} content`);
    
    // Aufruf der sicheren Supabase Edge Function, um den Job zu starten
    const { data, error } = await supabase.functions.invoke('secure-gemini', {
      body: { content, detectionType, language }
    });
    
    if (error) {
      console.error('Error calling secure-gemini function:', error);
      toast({
        title: "AI Analysis Error",
        description: "Could not start AI analysis. Will use built-in detection instead.",
        variant: "destructive"
      });
      throw new Error(`Failed to verify content: ${error.message}`);
    }
    
    if (!data || !data.jobId) {
      console.error('Invalid response from secure-gemini function, missing jobId');
      throw new Error(`Invalid response from secure-gemini function`);
    }
    
    console.log(`Gemini verification job created with ID: ${data.jobId}`);
    
    return {
      jobId: data.jobId
    };
  } catch (error) {
    console.error('Error verifying with secure Gemini function:', error);
    toast({
      title: "AI Analysis Error",
      description: "Failed to start AI verification. Using built-in detection instead.",
      variant: "destructive"
    });
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
    console.log(`Checking status for Gemini job: ${jobId}`);
    
    // First try with JSON encoded parameters
    const encodedParams = JSON.stringify({ jobId });
    console.log(`Using encoded params: ${encodedParams}`);
    
    const { data, error } = await supabase.functions.invoke(
      'secure-gemini/job-status',
      { 
        method: 'GET',
        headers: {
          'x-urlencoded-params': encodedParams,
          'x-jobid': jobId // Backup method
        }
      }
    );
    
    if (error) {
      console.error('Error calling job-status function:', error);
      return {
        status: 'failed',
        error: `Failed to get job status: ${error.message}`
      };
    }

    if (!data) {
      console.error('No data returned from job-status function');
      return {
        status: 'failed',
        error: 'No data returned from job status check'
      };
    }

    console.log(`Received job status: ${data.status} for job: ${jobId}`);
    
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
