
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
    return createErrorResponse(error.message, 500, error);
  }
});

/**
 * Handle job status request
 * @param req - Request object
 * @param url - URL object already parsed
 * @returns Response with job status and result
 */
async function handleJobStatus(req, url) {
  try {
    // Get jobId from the query parameters
    const jobId = url.searchParams.get('jobId');
    
    if (!jobId) {
      return createErrorResponse("Missing jobId parameter", 400);
    }
    
    const job = await getJob(jobId);
    
    if (!job) {
      return createErrorResponse("Job not found", 404);
    }
    
    return createResponse(job);
  } catch (error) {
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
    // Determine the appropriate prompt based on detection type
    let prompt = "";
    if (detectionType === 'url') {
      prompt = buildUrlPrompt(content);
    } else {
      prompt = buildTextPrompt(content);
    }

    console.log(`Processing Gemini API call for job ${jobId}`);
    console.log(`Content (first 50 chars): ${content.substring(0, 50)}...`);
    
    // Call the Gemini API with the API key
    const response = await callGeminiAPI(prompt, apiKey);
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
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    await failJob(jobId, error);
  }
}
