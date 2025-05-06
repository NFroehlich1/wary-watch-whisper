
// Follow Deno standards for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Import local modules
import { corsHeaders, createResponse, createErrorResponse } from "./utils.ts";
import { callGeminiAPI } from "./gemini-client.ts";
import { buildUrlPrompt, buildTextPrompt } from "./prompt-builder.ts";
import { processAiResponse } from "./response-parser.ts";
import { getJob, createJob, completeJob, failJob } from "./job-manager.ts";

// Main function that handles incoming requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();
  
  // Check if this is a job status request
  if (path === 'job-status') {
    return handleJobStatus(req, url);
  }

  try {
    // Get the API key only from environment variables
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    
    console.log("Starting secure-gemini function");
    
    if (!apiKey) {
      console.error("API key is missing");
      return createErrorResponse("API key is not configured properly.", 500);
    }

    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return createErrorResponse("Invalid JSON in request body", 400, parseError);
    }
    
    const { content, detectionType, language } = requestBody;
    
    if (!content) {
      return createErrorResponse("Missing 'content' parameter", 400);
    }
    
    if (!detectionType) {
      return createErrorResponse("Missing 'detectionType' parameter", 400);
    }

    // Create a unique job ID and store in database
    const jobId = await createJob();
    
    console.log(`Created job ${jobId} for content type: ${detectionType}`);
    
    // Start processing in the background
    EdgeRuntime.waitUntil(processGeminiRequest(jobId, content, detectionType, apiKey));
    
    // Return job ID immediately
    return createResponse({ jobId });

  } catch (error) {
    console.error("Error in secure-gemini function:", error);
    return createErrorResponse(error.message, 500, error);
  }
});

/**
 * Handle job status request - standardized parameter handling
 * @param req - Request object
 * @param url - URL object already parsed
 * @returns Response with job status and result
 */
async function handleJobStatus(req, url) {
  try {
    let jobId = null;
    
    // Try to get jobId from multiple sources
    
    // Option 1: Get jobId from request body (for POST requests)
    try {
      const body = await req.json();
      if (body && body.jobId) {
        jobId = body.jobId;
        console.log('Retrieved jobId from request body:', jobId);
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
    
    // Option 2: Get jobId from x-jobid header (fallback)
    if (!jobId && req.headers.has('x-jobid')) {
      jobId = req.headers.get('x-jobid');
      console.log('Retrieved jobId from x-jobid header:', jobId);
    }
    
    if (!jobId) {
      return createErrorResponse("Missing jobId parameter. Please provide jobId in body or header.", 400);
    }
    
    console.log(`Handling job status request for job: ${jobId}`);
    
    const job = await getJob(jobId);
    
    if (!job) {
      return createErrorResponse(`Job with ID '${jobId}' not found`, 404);
    }
    
    return createResponse(job);
  } catch (error) {
    console.error("Error fetching job status:", error);
    return createErrorResponse("Error fetching job status", 500, error);
  }
}

/**
 * Process Gemini request asynchronously
 * @param jobId - Job ID
 * @param content - Content to analyze
 * @param detectionType - Type of detection
 * @param apiKey - Gemini API key
 */
async function processGeminiRequest(jobId: string, content: string, detectionType: string, apiKey: string) {
  try {
    // Very simple prompt with minimal content
    let prompt = "";
    if (detectionType === 'url') {
      // Limit the URL length 
      const trimmedContent = content.length > 500 ? content.substring(0, 500) : content;
      prompt = buildUrlPrompt(trimmedContent);
    } else {
      // Limit text content 
      const trimmedContent = content.length > 1000 ? content.substring(0, 1000) : content;
      prompt = buildTextPrompt(trimmedContent);
    }

    console.log(`Processing Gemini API call for job ${jobId}`);
    console.log(`Content (first 50 chars): ${content.substring(0, 50)}...`);
    
    try {
      // Call the Gemini API with longer timeout
      const response = await callGeminiAPI(prompt, apiKey);
      
      // Extract text from response safely
      const aiResponse = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`Response preview for job ${jobId}: ${aiResponse.substring(0, 100)}...`);
      
      // Process the AI response to extract classification and explanation
      const { riskLevel, confidenceLevel, explanation } = processAiResponse(aiResponse);

      // Update job with result in database
      await completeJob(jobId, {
        riskAssessment: riskLevel,
        explanation: explanation,
        confidenceLevel: confidenceLevel
      });
    } catch (apiError) {
      if (apiError.name === 'TimeoutError' || apiError.name === 'AbortError') {
        console.error(`API request timed out for job ${jobId}`);
        await failJob(jobId, 'API request timed out');
      } else {
        throw apiError;
      }
    }
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await failJob(jobId, error instanceof Error ? error.message : String(error));
  }
}
