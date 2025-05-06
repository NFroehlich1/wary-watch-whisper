
/**
 * Optimized client for making requests to the Gemini API
 */

/**
 * Calls the Gemini API with optimized settings
 * @param prompt - The prompt to send to Gemini
 * @param apiKey - The Gemini API key
 * @returns Response data from Gemini
 * @throws Error if the API call fails
 */
export async function callGeminiAPI(prompt, apiKey) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  // Make sure prompt is not too long
  const trimmedPrompt = prompt.length > 500 ? prompt.substring(0, 500) : prompt;
  
  try {
    // Create an AbortController with a 90-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    try {
      console.log("Making Gemini API request with optimized parameters");
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: trimmedPrompt
            }]
          }],
          // Super-optimized parameters for fastest possible responses
          generationConfig: {
            maxOutputTokens: 150,   // Very limited output size
            temperature: 0.0,       // Zero temperature for deterministic responses
            topP: 1.0,              // Standard setting
            topK: 40                // Standard setting
          }
        }),
        signal: controller.signal
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Gemini API error: Status ${response.status}`);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (fetchError) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    
    // Better error handling
    if (error.name === 'AbortError') {
      throw new Error('API request timed out');
    }
    
    throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
  }
}
