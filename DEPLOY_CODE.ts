import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Gemini API Key nicht konfiguriert' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'verify-key':
        return await verifyGeminiKey(geminiApiKey);
      
      case 'generate-summary':
        return await generateSummary(geminiApiKey, data);
      
      case 'generate-article-summary':
        return await generateArticleSummary(geminiApiKey, data);
      
      case 'improve-article-title':
        return await improveArticleTitle(geminiApiKey, data);
      
      case 'qa-with-newsletter':
        return await qaWithNewsletter(geminiApiKey, data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unbekannte Aktion' }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('Error in gemini-ai function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyGeminiKey(apiKey: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Test"
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      })
    });

    if (response.ok) {
      return new Response(
        JSON.stringify({ isValid: true, message: "Gemini API-Schlüssel ist gültig" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      return new Response(
        JSON.stringify({ isValid: false, message: `API-Schlüssel ungültig: ${errorMessage}` }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ isValid: false, message: `Verbindungsfehler: ${(error as Error).message}` }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateSummary(apiKey: string, data: any) {
  const { digest, selectedArticles, linkedInPage } = data;
  const articlesToUse = selectedArticles || digest.items;
  
  if (articlesToUse.length === 0) {
    return new Response(
      JSON.stringify({ error: "Keine Artikel für die Zusammenfassung verfügbar" }), 
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const articleDetails = articlesToUse.map((article: any, index: number) => `
**ARTIKEL ${index + 1}:**
Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"
Quelle: ${article.sourceName || 'Unbekannte Quelle'}
Datum: ${article.pubDate}
Link: ${article.link}
${article.content ? `Inhalt: "${article.content.substring(0, 500)}..."` : ''}
`).join('\n');

  const prompt = `Du schreibst als Student für Studenten den Newsletter "LINKIT WEEKLY" - für eine HOCHSCHULGRUPPE zu KI, Data Science und Machine Learning. 

**ZIELGRUPPE:** 
- Studierende in Informatik, Data Science, Mathematik, Ingenieurswissenschaften
- Bachelor- und Master-Studierende, die sich für KI und ML interessieren
- Junge Menschen, die praktische Anwendungen und Karrierechancen suchen
- Community von tech-begeisterten Studierenden

**NEWSLETTER-INHALT basierend auf diesen Artikeln:**
${articleDetails}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, topK: 30, topP: 0.9, maxOutputTokens: 5000 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    let content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (linkedInPage && !content.includes("linkedin.com/company/linkit-karlsruhe")) {
      content += `\n\n---\n\n**Bleibt connected! 🤝**\nFür weitere Updates, Diskussionen und Community-Events folgt uns auf [LinkedIn](${linkedInPage}).`;
    }

    return new Response(
      JSON.stringify({ content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Fehler bei der Newsletter-Generierung: ${(error as Error).message}` }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateArticleSummary(apiKey: string, data: any) {
  const { article } = data;
  const articleContent = article.content || article.description || 'Nur Titel verfügbar';
  const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 1000);
  
  const prompt = `Fasse diesen KI-Artikel in 2-3 Sätzen zusammen für Studierende:
              
**Titel:** ${article.title}
**Inhalt:** ${cleanContent}

Erstelle eine präzise Zusammenfassung und erkläre die Relevanz für KI/Data Science Studierende.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 300 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    const summary = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({ summary }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function improveArticleTitle(apiKey: string, data: any) {
  const { article } = data;
  
  const prompt = `Verbessere diesen Artikel-Titel für deutsche KI/Data Science Studierende:

**Aktueller Titel:** ${article.title}
${article.description ? `**Beschreibung:** ${article.description.substring(0, 200)}...` : ''}

Erstelle einen verbesserten deutschen Titel (max. 80 Zeichen), der technisch korrekt aber studentenfreundlich ist.

Antworte nur mit dem verbesserten Titel.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 100 }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    const improvedTitle = responseData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    return new Response(
      JSON.stringify({ improvedTitle }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function qaWithNewsletter(apiKey: string, data: any) {
  const { question, newsletter } = data || {};

  if (!question || !newsletter) {
    return new Response(
      JSON.stringify({ error: "question und newsletter sind Pflichtfelder" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const prompt = `Beantworte die Frage bezugnehmend auf: ${newsletter}

Die Frage lautet: ${question}

Anweisungen:
- Beziehe dich nur auf die Informationen aus dem bereitgestellten Newsletter-Inhalt
- Antworte präzise und hilfreich auf Deutsch
- Falls die Information nicht im Newsletter-Inhalt vorhanden ist, sage das ehrlich
- Strukturiere deine Antwort klar und verständlich für Studierende
- Verwende einen freundlichen, aber informativen Ton`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 2048 }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errData?.error?.message || response.statusText}`);
    }

    const respData = await response.json();
    const content = respData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} 