
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
    // Reduce prompt complexity if it's too long
    const trimmedPrompt = prompt.length > 8000 ? prompt.substring(0, 8000) : prompt;
    
    // Create an AbortController with a longer timeout (45 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    
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
          // Optimized parameters to improve response time and reliability
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.1,
            topP: 0.9,
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
    
    // More detailed error handling
    if (error.name === 'AbortError') {
      throw new Error('Gemini API request timed out after 45 seconds');
    }
    
    // Better error message with type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API call failed: ${errorMessage}`);
  }
}
