
// Follow Deno standards for imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Set up CORS headers to allow requests from your frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Main function that handles incoming requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Access the securely stored API key from environment variables
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables");
    }

    // Parse the request body
    const { content, detectionType, language } = await req.json();
    
    if (!content || !detectionType) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine the appropriate prompt based on detection type
    let prompt = "";
    if (detectionType === 'url') {
      prompt = `Analyze if this URL is safe, suspicious or a scam. URL: "${content}". 
      Please respond with a structured answer starting with one of these exact classifications:
      - CLASSIFICATION: SAFE if you're highly confident it's legitimate
      - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
      - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
      - CLASSIFICATION: SCAM if you're highly confident it's malicious
      
      Then provide a brief justification in English.`;
    } else {
      prompt = `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${content}". 
      Please respond with a structured answer starting with one of these exact classifications:
      - CLASSIFICATION: SAFE if you're highly confident it's legitimate
      - CLASSIFICATION: SUSPICIOUS if there are minor concerns but not definitively malicious
      - CLASSIFICATION: HIGH SUSPICION if there are significant red flags but not 100% certain
      - CLASSIFICATION: SCAM if you're highly confident it's malicious
      
      Then provide a brief justification in English.`;
    }

    // Call the Gemini API securely with the API key
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
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
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Process the AI response to extract the classification and explanation
    let riskLevel = 'suspicious'; // Default
    let confidenceLevel;
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

    // Return the processed response
    return new Response(
      JSON.stringify({
        riskAssessment: riskLevel,
        explanation: explanation,
        confidenceLevel: confidenceLevel
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in secure-gemini function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
