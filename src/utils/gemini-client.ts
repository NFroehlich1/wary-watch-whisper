
/**
 * Client for the Gemini AI API
 * Provides interfaces to verify different types of content
 */
import { Language, RiskLevel } from "../types";
import { supabase } from "../integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { extractRiskAssessment, extractExplanation, extractConfidenceLevel } from './response-parser';

// Type definitions for verification results
export interface VerificationResult {
  riskAssessment: RiskLevel;
  explanation: string;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

// Type definition for job status
export interface JobStatus {
  status: 'pending' | 'completed' | 'failed';
  result?: VerificationResult;
  error?: string;
}

// Improved configuration for polling retries
const MAX_JOB_CHECK_ATTEMPTS = 30;      // Increased max attempts
const INITIAL_BACKOFF_MS = 500;         // Start with a 500ms wait
const MAX_BACKOFF_MS = 5000;            // Don't wait longer than 5 seconds between attempts
const BACKOFF_FACTOR = 1.3;             // Increase wait time by this factor with each attempt

/**
 * Starts an asynchronous content verification using Gemini AI
 */
export const verifyWithGemini = async (content: string, detectionType: 'url' | 'text' | 'voice', language: Language): Promise<{
  jobId: string;
}> => {
  try {
    console.log(`Starting Gemini verification for ${detectionType} content`);
    
    // Trim content early to prevent issues
    const trimmedContent = detectionType === 'url' 
      ? content.substring(0, 300) 
      : content.substring(0, 500);
    
    // Use a timeout promise for the function call (30 seconds)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Function call timed out")), 30000);
    });
    
    try {
      // Create race between function call and timeout
      const result = await Promise.race([
        supabase.functions.invoke('secure-gemini', {
          body: { 
            content: trimmedContent, 
            detectionType
            // Removed language parameter as it's not used in the simplified version
          }
        }),
        timeoutPromise
      ]);
      
      // Since result will be from the function call if successful
      const { data, error } = result as any;
      
      if (error) {
        console.error('Error calling secure-gemini function:', error);
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
      title: "Verification Error",
      description: "Failed to start AI verification.",
      variant: "destructive"
    });
    throw new Error(`Failed to start verification job: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Gets the status and result of a verification job
 * Uses multiple approaches to increase reliability
 */
export const getVerificationResult = async (jobId: string): Promise<JobStatus> => {
  try {
    console.log(`Checking status for Gemini job: ${jobId}`);
    
    // Try multiple approaches to fetch job status
    try {
      // Approach 1: Using GET with query params in URL
      const { data, error } = await supabase.functions.invoke(
        `secure-gemini/job-status?jobId=${encodeURIComponent(jobId)}`,
        { method: 'GET' }
      );
      
      if (!error && data) {
        console.log(`Received job status via GET query: ${data.status} for job: ${jobId}`);
        return {
          status: data.status,
          result: data.result,
          error: data.error
        };
      }
      
      // Log error but continue to try other approaches
      if (error) {
        console.warn('Error with GET query approach:', error);
      }
      
      // Approach 2: Using POST with body
      const postResult = await supabase.functions.invoke(
        'secure-gemini/job-status',
        { 
          method: 'POST',
          body: { jobId }
        }
      );
      
      if (!postResult.error && postResult.data) {
        console.log(`Received job status via POST body: ${postResult.data.status} for job: ${jobId}`);
        return {
          status: postResult.data.status,
          result: postResult.data.result,
          error: postResult.data.error
        };
      }
      
      // Log error but continue to try other approaches
      if (postResult.error) {
        console.warn('Error with POST body approach:', postResult.error);
      }
      
      // Approach 3: Using GET with header
      const headerResult = await supabase.functions.invoke(
        'secure-gemini/job-status',
        { 
          method: 'GET',
          headers: { 'x-jobid': jobId }
        }
      );
      
      if (!headerResult.error && headerResult.data) {
        console.log(`Received job status via header: ${headerResult.data.status} for job: ${jobId}`);
        return {
          status: headerResult.data.status,
          result: headerResult.data.result,
          error: headerResult.data.error
        };
      }
      
      // If we reach here, all approaches failed
      console.error(`All approaches to get job status for ${jobId} failed`);
      
      // Return a failed status
      return {
        status: 'failed',
        error: 'Communication with job status endpoint failed after multiple attempts'
      };
      
    } catch (fetchError) {
      console.error('Error fetching job status:', fetchError);
      return {
        status: 'failed',
        error: `Failed to communicate with job status endpoint: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
      };
    }
  } catch (error) {
    console.error('Error in getVerificationResult:', error);
    return {
      status: 'failed',
      error: `Exception in getVerificationResult: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
