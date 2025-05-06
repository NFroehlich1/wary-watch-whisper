
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
      // Add longer timeout to the fetch request - 40 seconds instead of default 
      signal: AbortSignal.timeout(40000)
    });

    if (!response.ok) {
      console.error(`Gemini API error: Status ${response.status}, ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error response: ${errorText}`);
      throw new Error(`Gemini API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    // Better error message with type checking
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini API call failed: ${errorMessage}`);
  }
}
