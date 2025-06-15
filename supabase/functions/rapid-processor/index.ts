import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to convert ArrayBuffer to base64 in chunks (memory-safe)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192; // 8KB chunks
  let result = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  
  return btoa(result);
}

async function verifyApiKey(apiKey: string) {
  try {
    console.log("🔍 Verifying Eleven Labs API key...");
    
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey
      }
    });

    if (!response.ok) {
      console.error('API Key verification failed:', response.status);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: `API-Schlüssel ungültig: ${response.status}` 
        }), 
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userData = await response.json();
    console.log("✅ API Key verified successfully");
    
    return new Response(
      JSON.stringify({ 
        valid: true, 
        user: userData,
        message: "API-Schlüssel erfolgreich verifiziert"
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error verifying API key:", error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: `Fehler bei der Verifikation: ${(error as Error).message}` 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function textToSpeech(apiKey: string, data: any) {
  try {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = data || {};
    
    if (!text || !text.trim()) {
      return new Response(
        JSON.stringify({ error: 'Text ist erforderlich' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean the text for better TTS (remove markdown, limit length)
    const cleanText = text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
      .replace(/[#*_`]/g, '') // Remove markdown formatting
      .replace(/\n+/g, ' ') // Replace line breaks with spaces
      .trim();

    // Limit text length (Eleven Labs has character limits)
    const maxLength = 2500; // Conservative limit
    const textToSpeak = cleanText.length > maxLength 
      ? cleanText.substring(0, maxLength).trim() + '...'
      : cleanText;

    if (textToSpeak.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text ist zu kurz oder leer nach der Bereinigung' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 Generating speech for ${textToSpeak.length} characters`);
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: textToSpeak,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Eleven Labs API Error:', response.status, errorData);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Eleven Labs API-Konfiguration.' }), 
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'API-Limit erreicht. Bitte versuchen Sie es später erneut.' }), 
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 400) {
        return new Response(
          JSON.stringify({ error: 'Ungültige Anfrage. Bitte überprüfen Sie den Text oder die Einstellungen.' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (response.status === 500) {
        return new Response(
          JSON.stringify({ error: 'Interner Serverfehler bei Eleven Labs. Bitte versuchen Sie es später erneut.' }), 
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: `Fehler bei der Sprachgenerierung: ${response.status}` }), 
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Get the audio blob
    const audioBlob = await response.blob();
    console.log(`📊 Audio blob size: ${audioBlob.size} bytes`);
    
    // Convert blob to base64 using memory-safe chunked processing
    const buffer = await audioBlob.arrayBuffer();
    console.log(`🔄 Converting ${buffer.byteLength} bytes to base64...`);
    
    const base64Audio = arrayBufferToBase64(buffer);
    console.log(`✅ Base64 conversion complete: ${base64Audio.length} characters`);
    
    return new Response(
      JSON.stringify({ 
        audioBase64: base64Audio,
        mimeType: 'audio/mpeg',
        textLength: textToSpeak.length,
        audioSize: buffer.byteLength
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error generating speech:", error);
    return new Response(
      JSON.stringify({ error: `Fehler bei der Sprachgenerierung: ${(error as Error).message}` }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const elevenLabsApiKey = Deno.env.get('ELEVEN-LABS-API-KEY');
    
    if (!elevenLabsApiKey) {
      console.error('ELEVEN-LABS-API-KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Eleven Labs API Key nicht konfiguriert' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { action, data } = await req.json().catch(() => ({}));
    
    console.log(`🔧 Processing action: ${action}`);

    switch (action) {
      case 'get-key':
        // Return the API key (like gemini-ai function)
        return new Response(
          JSON.stringify({ apiKey: elevenLabsApiKey }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'verify-key':
        // Verify the API key by making a test request
        return await verifyApiKey(elevenLabsApiKey);
      
      case 'text-to-speech':
        // Handle TTS directly
        return await textToSpeech(elevenLabsApiKey, data);
      
      default:
        // Default: return API key (for backward compatibility)
        return new Response(
          JSON.stringify({ apiKey: elevenLabsApiKey }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in rapid-processor function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 