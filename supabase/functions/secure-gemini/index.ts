
// Follow Deno standards for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

/**
 * CORS headers for cross-origin requests
 * Allows requests from any origin with specific allowed headers
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Response helper function to maintain consistent response format
 * @param data - Response data to be sent
 * @param status - HTTP status code
 * @returns Response object
 */
const createResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

/**
 * Error response helper that logs errors and returns formatted error responses
 * @param message - Error message
 * @param status - HTTP status code
 * @param error - Original error object for logging
 * @returns Response object with error details
 */
const createErrorResponse = (message: string, status = 500, error?: Error) => {
  if (error) {
    console.error(`Error in secure-gemini function: ${error.message}`);
    console.error(error.stack);
  }
  return createResponse({ error: message }, status);
};

// In-memory job storage (for demo purposes - in production use a database)
// Format: { [jobId: string]: { status: 'pending' | 'completed' | 'failed', result?: any, error?: string } }
const jobs = new Map();

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

    // Create a unique job ID
    const jobId = crypto.randomUUID();
    jobs.set(jobId, { status: 'pending' });
    
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
 * Handle job status request - Updated to accept URL directly
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
    
    const job = jobs.get(jobId);
    
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

    // Update job with result
    jobs.set(jobId, {
      status: 'completed',
      result: {
        riskAssessment: riskLevel,
        explanation: explanation,
        confidenceLevel: confidenceLevel
      }
    });
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    jobs.set(jobId, {
      status: 'failed',
      error: error.message
    });
  }
}

/**
 * Constructs a URL analysis prompt
 * @param url - The URL to analyze
 * @returns Formatted prompt string
 */
function buildUrlPrompt(url: string): string {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
}

/**
 * Constructs a text analysis prompt
 * @param text - The text content to analyze
 * @returns Formatted prompt string
 */
function buildTextPrompt(text: string): string {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with a structured answer starting with one of these exact classifications:
  - CLASSIFICATION: SAFE if you're highly confident it's legitimate
  - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
  - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
  - CLASSIFICATION: SCAM if you're highly confident it's malicious
  
  Then provide a brief justification in English.`;
}

/**
 * Calls the Gemini API
 * @param prompt - The prompt to send to Gemini
 * @param apiKey - The Gemini API key
 * @returns Response data from Gemini
 * @throws Error if the API call fails
 */
async function callGeminiAPI(prompt: string, apiKey: string) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!response.ok) {
    console.error(`Gemini API error: Status ${response.status}, ${response.statusText}`);
    const errorText = await response.text();
    console.error(`Error response: ${errorText}`);
    throw new Error(`Gemini API error: ${response.statusText} (${response.status})`);
  }

  return await response.json();
}

/**
 * Processes the AI response to extract classification information
 * @param aiResponse - The raw response from Gemini
 * @returns Structured response with risk level, confidence, and explanation
 */
function processAiResponse(aiResponse: string): { 
  riskLevel: string, 
  confidenceLevel: string, 
  explanation: string 
} {
  let riskLevel = 'suspicious'; // Default
  let confidenceLevel = 'medium'; // Default
  let explanation = '';

  // Extract classification and confidence level
  if (aiResponse.toLowerCase().includes('classification: scam')) {
    riskLevel = 'scam';
    confidenceLevel = 'high';
  } else if (aiResponse.toLowerCase().includes('classification: high suspicion')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'high';
  } else if (aiResponse.toLowerCase().includes('classification: suspicious')) {
    riskLevel = 'suspicious';
    confidenceLevel = 'medium';
  } else if (aiResponse.toLowerCase().includes('classification: safe')) {
    riskLevel = 'safe';
    confidenceLevel = 'high';
  }

  // Extract explanation (everything after the classification line)
  const classificationMatch = aiResponse.match(/CLASSIFICATION: (SAFE|SUSPICIOUS|HIGH SUSPICION|SCAM)/i);
  if (classificationMatch) {
    explanation = aiResponse.substring(aiResponse.indexOf(classificationMatch[0]) + classificationMatch[0].length).trim();
  } else {
    explanation = aiResponse;
  }

  return { riskLevel, confidenceLevel, explanation };
}
