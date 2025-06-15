import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log('🚀 Mistral Supabase AI function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { action, data } = requestBody;
    console.log(`🎯 Action requested: ${action}`);

    switch (action) {
      case 'verify-key':
        // For Supabase AI, verification is automatic
        return new Response(
          JSON.stringify({ 
            isValid: true, 
            message: "Supabase AI ist verfügbar",
            provider: "supabase-ai"
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'generate-summary':
        console.log('📄 Generating summary with Supabase AI...');
        return await generateSummaryWithSupabaseAI(data);
      
      case 'generate-article-summary':
        console.log('📝 Generating article summary with Supabase AI...');
        return await generateArticleSummaryWithSupabaseAI(data);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unbekannte Aktion', receivedAction: action }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('💥 Error in mistral-supabase-ai function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateSummaryWithSupabaseAI(data: any) {
  const { digest, selectedArticles, linkedInPage } = data;
  const articlesToUse = selectedArticles || digest.items;
  
  if (articlesToUse.length === 0) {
    return new Response(
      JSON.stringify({ error: "Keine Artikel für die Zusammenfassung verfügbar" }), 
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🤖 Initializing Supabase AI session for Mistral...');
    
    // Initialize Supabase AI session with Mistral
    const session = new Supabase.ai.Session('mistral');
    
    const articleDetails = articlesToUse.map((article: any, index: number) => `
**ARTIKEL ${index + 1}:**
Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"
Link: ${article.link}
`).join('\n');

    const prompt = `Erstelle einen Newsletter für KI/Data Science Studierende auf Deutsch.

# 📬 LINKIT WEEKLY KW ${digest.weekNumber}/${digest.year}
KW ${digest.weekNumber} · ${digest.dateRange}

## Hey Leute! 👋
[Lockere Begrüßung]

## 🔥 Diese Woche für euch
[Für jeden Artikel: Titel, Zusammenfassung, Relevanz]

## 💡 Bottom Line
[Fazit und Community-Aufruf]

**ARTIKEL:**
${articleDetails}

Stil: Locker, studentisch, praktisch relevant, ca. 800 Wörter.`;

    console.log('📤 Running AI inference...');
    
    // Run the AI model
    const output = await session.run(prompt, {
      temperature: 0.3,
      max_tokens: 2000
    });
    
    let content = '';
    
    // Handle streaming response
    if (output && typeof output[Symbol.asyncIterator] === 'function') {
      console.log('📡 Processing streaming response...');
      for await (const chunk of output) {
        if (chunk.response) {
          content += chunk.response;
        }
      }
    } else {
      // Handle direct response
      content = String(output);
    }
    
    console.log('✅ Content generated via Supabase AI, length:', content.length);
    
    if (!content || content.trim().length === 0) {
      throw new Error("Supabase AI hat leeren Inhalt zurückgegeben");
    }
    
    // Add LinkedIn reference if provided
    if (linkedInPage && !content.includes("linkedin.com/company/linkit-karlsruhe")) {
      content += `\n\n---\n\n**Bleibt connected! 🤝**\nFür weitere Updates folgt uns auf [LinkedIn](${linkedInPage})!`;
    }

    return new Response(
      JSON.stringify({ content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("💥 Error generating summary with Supabase AI:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: `Fehler bei der Newsletter-Generierung: ${errorMessage}`,
        provider: "supabase-ai",
        timestamp: new Date().toISOString()
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateArticleSummaryWithSupabaseAI(data: any) {
  const { article } = data;

  if (!article || !article.title) {
    return new Response(
      JSON.stringify({ error: "article mit title ist ein Pflichtfeld" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🤖 Generating article summary with Supabase AI...');
    
    const session = new Supabase.ai.Session('mistral');
    
    const articleContent = article.content || article.description || 'Nur Titel verfügbar';
    const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 800);

    const prompt = `Fasse diesen KI-Artikel in 2-3 Sätzen zusammen für deutsche Studierende:

**Titel:** ${article.title}
**Inhalt:** ${cleanContent}

Erstelle eine präzise Zusammenfassung und erkläre die Relevanz für KI/Data Science Studierende. Antworte auf Deutsch.`;

    const output = await session.run(prompt, {
      temperature: 0.3,
      max_tokens: 200
    });
    
    let summary = '';
    
    // Handle streaming or direct response
    if (output && typeof output[Symbol.asyncIterator] === 'function') {
      for await (const chunk of output) {
        if (chunk.response) {
          summary += chunk.response;
        }
      }
    } else {
      summary = String(output);
    }
    
    console.log('✅ Article summary generated via Supabase AI');
    
    if (!summary || summary.trim().length === 0) {
      throw new Error("Keine Zusammenfassung generiert");
    }

    return new Response(
      JSON.stringify({ summary: summary.trim() }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("💥 Error generating article summary:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} 