
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

// Constants for timeout configuration
const MAX_JOB_CHECK_ATTEMPTS = 20; // Maximum number of attempts to check job status
const INITIAL_BACKOFF_MS = 500;    // Start with a 500ms wait
const MAX_BACKOFF_MS = 5000;       // Don't wait longer than 5 seconds between attempts
const BACKOFF_FACTOR = 1.3;        // Increase wait time by this factor with each attempt

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
    
    // Trim content if too long to prevent timeouts
    const trimmedContent = detectionType === 'url' 
      ? content.substring(0, 500) 
      : content.substring(0, 1000);
    
    // Using a timeout promise for the function call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Function call timed out")), 15000);
    });
    
    try {
      // Create race between function call and timeout
      const result = await Promise.race([
        supabase.functions.invoke('secure-gemini', {
          body: { 
            content: trimmedContent, 
            detectionType, 
            language 
          }
        }),
        timeoutPromise
      ]);
      
      // Since result will be from the function call if successful
      const { data, error } = result as any;
      
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
    } catch (functionError) {
      if (functionError.name === "TimeoutError" || functionError.message === "Function call timed out") {
        console.error('Function call timed out');
        throw new Error('Gemini verification request timed out');
      }
      throw functionError;
    }
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
    
    // Use POST method with body instead of queryParams to pass jobId
    const { data, error } = await supabase.functions.invoke(
      'secure-gemini/job-status',
      { 
        method: 'POST',
        body: { jobId },
        headers: {
          'x-jobid': jobId
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
