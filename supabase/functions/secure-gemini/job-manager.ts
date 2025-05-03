
/**
 * Manages job tracking and processing for asynchronous Gemini API requests
 */

// In-memory job storage (for demo purposes - in production use a database)
// Format: { [jobId: string]: { status: 'pending' | 'completed' | 'failed', result?: any, error?: string } }
export const jobs = new Map();

/**
 * Get job status
 * @param jobId - Job identifier
 * @returns Job status and results if available
 */
export function getJob(jobId: string) {
  return jobs.get(jobId);
}

/**
 * Create a new job and return its ID
 * @returns Job ID string
 */
export function createJob(): string {
  const jobId = crypto.randomUUID();
  jobs.set(jobId, { status: 'pending' });
  return jobId;
}

/**
 * Update job with completed status and results
 * @param jobId - Job identifier
 * @param result - Job results
 */
export function completeJob(jobId: string, result: any): void {
  jobs.set(jobId, {
    status: 'completed',
    result
  });
}

/**
 * Update job with failed status and error message
 * @param jobId - Job identifier
 * @param error - Error message or object
 */
export function failJob(jobId: string, error: string | Error): void {
  const errorMessage = error instanceof Error ? error.message : error;
  jobs.set(jobId, {
    status: 'failed',
    error: errorMessage
  });
}
