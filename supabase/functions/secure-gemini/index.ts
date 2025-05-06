
// Follow Deno standards for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Import local modules
import { corsHeaders, createResponse, createErrorResponse } from "./utils.ts";
import { callGeminiAPI } from "./gemini-client.ts";
import { buildUrlPrompt, buildTextPrompt, buildAnalysisQuestionPrompt } from "./prompt-builder.ts";
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
    return handleJobStatus(req);
  }

  try {
    // Get the API key from environment variables
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
      return createErrorResponse("Invalid JSON in request body", 400);
    }
    
    const { content, detectionType } = requestBody;
    
    if (!content) {
      return createErrorResponse("Missing 'content' parameter", 400);
    }
    
    if (!detectionType) {
      return createErrorResponse("Missing 'detectionType' parameter", 400);
    }

    // Create a unique job ID and store in database
    const jobId = await createJob();
    
    console.log(`Created job ${jobId} for content type: ${detectionType}`);
    
    // Start processing in the background to avoid function timeout
    EdgeRuntime.waitUntil(processGeminiRequest(jobId, content, detectionType, apiKey, requestBody));
    
    // Return job ID immediately
    return createResponse({ jobId });

  } catch (error) {
    console.error("Error in secure-gemini function:", error);
    return createErrorResponse(error.message, 500);
  }
});

/**
 * Handle job status request with multiple ways to extract the jobId
 * @param req - Request object
 * @returns Response with job status and result
 */
async function handleJobStatus(req) {
  try {
    let jobId = null;
    
    // First attempt: Try to get jobId from URL query parameters
    const url = new URL(req.url);
    if (url.searchParams.has('jobId')) {
      jobId = url.searchParams.get('jobId');
    }
    
    // Second attempt: Try to get jobId from request body
    if (!jobId) {
      try {
        const body = await req.json();
        if (body && body.jobId) {
          jobId = body.jobId;
        }
      } catch (e) {
        // Silent fail - body parsing failed, continue to other methods
      }
    }
    
    // Third attempt: Try to get jobId from headers
    if (!jobId) {
      if (req.headers.has('x-jobid')) {
        jobId = req.headers.get('x-jobid');
      }
    }
    
    if (!jobId) {
      console.error("No jobId found in request");
      return createErrorResponse("Missing jobId parameter", 400);
    }
    
    console.log(`Handling job status request for job: ${jobId}`);
    
    const job = await getJob(jobId);
    
    if (!job) {
      console.error(`Job with ID '${jobId}' not found`);
      return createErrorResponse(`Job with ID '${jobId}' not found`, 404);
    }
    
    return createResponse(job);
  } catch (error) {
    console.error("Error fetching job status:", error);
    return createErrorResponse("Error fetching job status", 500);
  }
}

/**
 * Process Gemini request asynchronously as a background task
 */
async function processGeminiRequest(jobId, content, detectionType, apiKey, requestBody) {
  try {
    // Build prompt based on detection type
    let prompt = "";
    
    // Check if this is an analysis question
    if (requestBody.question && requestBody.analysisDetails) {
      // Extract details needed for question prompt
      const { question, content: contentToAnalyze, riskLevel, explanation } = requestBody;
      prompt = buildAnalysisQuestionPrompt(question, contentToAnalyze, riskLevel, explanation);
    } else if (detectionType === 'url') {
      // Regular URL detection
      const trimmedContent = content.length > 300 ? content.substring(0, 300) : content;
      prompt = buildUrlPrompt(trimmedContent);
    } else {
      // Regular text detection
      const trimmedContent = content.length > 500 ? content.substring(0, 500) : content;
      prompt = buildTextPrompt(trimmedContent);
    }

    console.log(`Processing Gemini API call for job ${jobId}`);
    
    try {
      // Call the Gemini API with timeout handling
      const response = await callGeminiAPI(prompt, apiKey);
      
      // Extract text from response safely
      const aiResponse = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      console.log(`Response received for job ${jobId}: ${aiResponse.substring(0, 50)}...`);
      
      // Process AI response
      // For analysis questions, we don't need to extract risk level
      if (requestBody.question) {
        await completeJob(jobId, {
          riskAssessment: requestBody.riskLevel || 'unknown',
          explanation: aiResponse,
          confidenceLevel: 'high'
        });
      } else {
        // For regular detection, process the response to extract risk level
        const { riskLevel, confidenceLevel, explanation } = processAiResponse(aiResponse);
        await completeJob(jobId, {
          riskAssessment: riskLevel,
          explanation: explanation,
          confidenceLevel: confidenceLevel
        });
      }
      
      console.log(`Job ${jobId} completed successfully`);
    } catch (apiError) {
      console.error(`API error for job ${jobId}:`, apiError);
      await failJob(jobId, `API error: ${apiError.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await failJob(jobId, `Processing error: ${error.message || 'Unknown error'}`);
  }
}
