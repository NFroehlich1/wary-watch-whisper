
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
