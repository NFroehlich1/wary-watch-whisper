
/**
 * Utility functions for the secure-gemini Edge Function
 */

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Creates a standardized response with proper headers
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns Response object
 */
export const createResponse = (data: any, status = 200) => {
  return new Response(
    JSON.stringify(data),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
};

/**
 * Creates a standardized error response
 * @param message - Error message
 * @param status - HTTP status code (default: 500)
 * @param error - Original error object for logging
 * @returns Response object with error details
 */
export const createErrorResponse = (message: string, status = 500, error?: Error) => {
  if (error) {
    console.error(`Error in secure-gemini function: ${error.message}`);
    console.error(error.stack);
  }
  return createResponse({ error: message }, status);
};
