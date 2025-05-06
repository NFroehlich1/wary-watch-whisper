
/**
 * Client for making requests to the Gemini API
 */

/**
 * Calls the Gemini API
 * @param prompt - The prompt to send to Gemini
 * @param apiKey - The Gemini API key
 * @returns Response data from Gemini
 * @throws Error if the API call fails
 */
export async function callGeminiAPI(prompt: string, apiKey: string) {
  const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
  
  console.log('Making request to Gemini API...');

  try {
    // Use a shorter prompt if too long
    const trimmedPrompt = prompt.length > 2000 ? prompt.substring(0, 2000) : prompt;
    
    // Create an AbortController with a longer timeout (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
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
          // Optimized parameters for faster, more reliable responses
          generationConfig: {
            maxOutputTokens: 300,  // Reduced for faster responses
            temperature: 0.0,      // Set to 0 for most deterministic responses
            topP: 0.95,
            topK: 40
          }
        }),
        signal: controller.signal
      });
      
      // Clear the timeout as the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Gemini API error: Status ${response.status}, ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Gemini API error: ${response.statusText} (${response.status})`);
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
      throw new Error('Gemini API request timed out after 60 seconds');
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API call failed: ${errorMessage}`);
  }
}
