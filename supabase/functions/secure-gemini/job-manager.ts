
/**
 * Manages job tracking and processing for asynchronous Gemini API requests
 * Uses Supabase database for persistent job storage
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Get job status
 * @param jobId - Job identifier
 * @returns Job status and results if available, or null if job not found
 */
export async function getJob(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('gemini_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      console.error('Error fetching job:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exception fetching job:', error);
    return null;
  }
}

/**
 * Create a new job and return its ID
 * @returns Job ID string
 */
export async function createJob(): Promise<string> {
  const jobId = crypto.randomUUID();
  
  try {
    const { error } = await supabase
      .from('gemini_jobs')
      .insert({
        id: jobId,
        status: 'pending'
      });
    
    if (error) {
      console.error('Error creating job:', error);
      throw new Error(`Failed to create job: ${error.message}`);
    }
    
    return jobId;
  } catch (error) {
    console.error('Exception creating job:', error);
    throw new Error(`Failed to create job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update job with completed status and results
 * @param jobId - Job identifier
 * @param result - Job results
 */
export async function completeJob(jobId: string, result: any): Promise<void> {
  try {
    const { error } = await supabase
      .from('gemini_jobs')
      .update({
        status: 'completed',
        result: result
      })
      .eq('id', jobId);
    
    if (error) {
      console.error(`Error completing job ${jobId}:`, error);
      throw new Error(`Failed to complete job: ${error.message}`);
    }
  } catch (error) {
    console.error(`Exception completing job ${jobId}:`, error);
    throw new Error(`Failed to complete job: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Update job with failed status and error message
 * @param jobId - Job identifier
 * @param error - Error message or object
 */
export async function failJob(jobId: string, error: string | Error): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  try {
    const { error: dbError } = await supabase
      .from('gemini_jobs')
      .update({
        status: 'failed',
        error: errorMessage
      })
      .eq('id', jobId);
    
    if (dbError) {
      console.error(`Error failing job ${jobId}:`, dbError);
      throw new Error(`Failed to update job with error: ${dbError.message}`);
    }
  } catch (error) {
    console.error(`Exception failing job ${jobId}:`, error);
    throw new Error(`Failed to update job with error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
