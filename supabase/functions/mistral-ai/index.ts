import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log('🚀 Mistral function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔍 Checking for MISTRAL-API-KEY environment variable...');
    const mistralApiKey = Deno.env.get('MISTRAL-API-KEY');
    
    if (!mistralApiKey) {
      console.error('❌ MISTRAL-API-KEY not found in environment');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => !key.includes('SECRET')));
      return new Response(
        JSON.stringify({ 
          error: 'Mistral API Key nicht konfiguriert', 
          details: 'Die MISTRAL-API-KEY Umgebungsvariable ist nicht gesetzt',
          debug: 'Überprüfen Sie die Supabase Edge Function Secrets'
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    console.log('✅ MISTRAL-API-KEY found, length:', mistralApiKey.length);
    console.log('🔑 Key starts with:', mistralApiKey.substring(0, 8) + '...');

    const requestBody = await req.json();
    console.log('📝 Request body received:', {
      action: requestBody.action,
      hasData: !!requestBody.data,
      dataKeys: requestBody.data ? Object.keys(requestBody.data) : []
    });
    
    const { action, data } = requestBody;

    console.log(`🎯 Action requested: ${action}`);

    switch (action) {
      case 'verify-key':
        console.log('🔑 Verifying Mistral API key...');
        return await verifyMistralKey(mistralApiKey);
      
      case 'generate-summary':
        console.log('📄 Generating summary...');
        console.log('📊 Summary request data:', {
          hasDigest: !!data?.digest,
          digestItems: data?.digest?.items?.length || 0,
          hasSelectedArticles: !!data?.selectedArticles,
          selectedArticlesCount: data?.selectedArticles?.length || 0,
          hasLinkedInPage: !!data?.linkedInPage
        });
        return await generateSummary(mistralApiKey, data);
      
      case 'generate-article-summary':
        console.log('📝 Generating article summary...');
        console.log('📄 Article summary request data:', {
          hasArticle: !!data?.article,
          articleTitle: data?.article?.title?.substring(0, 50) + '...' || 'N/A',
          hasContent: !!data?.article?.content,
          hasDescription: !!data?.article?.description
        });
        return await generateArticleSummary(mistralApiKey, data);
      
      case 'improve-article-title':
        console.log('✨ Improving article title...');
        return await improveArticleTitle(mistralApiKey, data);
      
      case 'translate-title-to-english':
        console.log('🌍 Translating title to English...');
        return await translateTitleToEnglish(mistralApiKey, data);
      
      case 'qa-with-newsletter':
        console.log('❓ QA with newsletter...');
        return await qaWithNewsletter(mistralApiKey, data);
      
      default:
        console.error('❌ Unknown action:', action);
        return new Response(
          JSON.stringify({ error: 'Unbekannte Aktion', receivedAction: action }), 
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }
  } catch (error) {
    console.error('💥 Error in mistral-ai function:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function verifyMistralKey(apiKey: string) {
  try {
    console.log('🔍 Testing Mistral API connection...');
    console.log('🌐 Making request to:', 'https://api.mistral.ai/v1/models');
    
    const response = await fetch('https://api.mistral.ai/v1/models', {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      }
    });

    console.log('📡 Mistral API response status:', response.status);
    console.log('📡 Mistral API response headers:', response.headers);

    if (response.ok) {
      const models = await response.json();
      console.log('✅ Mistral API key verification successful, models found:', models.data?.length || 0);
      return new Response(
        JSON.stringify({ 
          isValid: true, 
          message: "Mistral API-Schlüssel ist gültig",
          modelsCount: models.data?.length || 0
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorText = await response.text();
      console.error('❌ Mistral API error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      const errorMessage = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`;
      console.error('❌ Parsed error message:', errorMessage);
      
      return new Response(
        JSON.stringify({ 
          isValid: false, 
          message: `API-Schlüssel ungültig: ${errorMessage}`,
          status: response.status,
          details: errorData
        }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('💥 Mistral API connection error:', error);
    console.error('💥 Connection error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack'
    });
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        isValid: false, 
        message: `Verbindungsfehler: ${errorMessage}`,
        errorType: error instanceof Error ? error.constructor.name : typeof error
      }), 
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

  console.log('📊 Processing articles for summary:', {
    totalArticles: articlesToUse.length,
    firstArticleTitle: articlesToUse[0]?.title?.substring(0, 50) + '...'
  });

  // Erstelle einen detaillierten, studentenorientierten Prompt basierend auf den tatsächlichen Artikeln
  const articleDetails = articlesToUse.map((article: any, index: number) => `
**ARTIKEL ${index + 1}:**
Titel: "${article.title}"
Beschreibung: "${article.description || 'Keine Beschreibung verfügbar'}"
Quelle: ${article.sourceName || 'Unbekannte Quelle'}
Datum: ${article.pubDate}
Link: ${article.link}
${article.content ? `Inhalt: "${article.content.substring(0, 500)}..."` : ''}
`).join('\n');

  // Shorter, more focused prompt for better reliability
  const prompt = `Erstelle einen Newsletter für KI/Data Science Studierende auf Deutsch.

**ZIELGRUPPE:** Studierende der Informatik, Data Science, Mathematik

**NEWSLETTER-STRUKTUR:**
# 📬 LINKIT WEEKLY KW ${digest.weekNumber}/${digest.year}
KW ${digest.weekNumber} · ${digest.dateRange}

## Hey Leute! 👋

[Lockere Begrüßung ohne Förmlichkeiten]

## 🔥 Diese Woche für euch

[Für jeden Artikel: Titel, 2-3 Sätze Zusammenfassung, Relevanz für Studierende, Link]

## 💡 Bottom Line

[Kurzes Fazit und Community-Aufruf]

**ARTIKEL-INHALTE:**
${articleDetails}

**WICHTIG:** 
- Nutze nur Infos aus den Artikeln
- Lockerer, studentischer Ton
- Praktische Relevanz betonen
- Echte Links verwenden
- Ca. 800-1200 Wörter`;

  try {
    console.log('📤 Making Mistral API request...');
    console.log('📏 Prompt length:', prompt.length);
    
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-tiny", // Using most accessible model
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 3000, // Reduced for reliability
      })
    });

    console.log('📡 Mistral API response status:', response.status);
    console.log('📋 Response headers:', {
      'content-type': response.headers.get('content-type'),
      'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
      'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Mistral API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      // Handle specific error types
      if (response.status === 429) {
        const errorMessage = "Rate limit erreicht. Bitte warten Sie 1-2 Minuten und versuchen Sie es erneut.";
        throw new Error(errorMessage);
      } else if (response.status === 401) {
        const errorMessage = "API-Schlüssel ungültig oder abgelaufen.";
        throw new Error(errorMessage);
      } else if (response.status === 403) {
        const errorMessage = "Zugriff verweigert. Überprüfen Sie Ihr Mistral-Abonnement.";
        throw new Error(errorMessage);
      } else {
        const errorMessage = `Mistral API Fehler: ${response.status} - ${errorData?.error?.message || errorData?.message || response.statusText}`;
        throw new Error(errorMessage);
      }
    }

    const responseData = await response.json();
    console.log('📥 Response structure:', {
      hasChoices: !!responseData.choices,
      choicesLength: responseData.choices?.length || 0,
      hasFirstChoice: !!responseData.choices?.[0],
      hasMessage: !!responseData.choices?.[0]?.message,
      hasContent: !!responseData.choices?.[0]?.message?.content,
      contentLength: responseData.choices?.[0]?.message?.content?.length || 0
    });
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
      console.error('❌ Unexpected response structure:', responseData);
      throw new Error("Unerwartete Antwort von der Mistral API - keine gültigen Inhalte erhalten");
    }

    let content = responseData.choices[0].message.content;
    console.log('✅ Content generated, length:', content.length);
    console.log('📝 Content preview:', content.substring(0, 200) + '...');
    
    if (!content || content.trim().length === 0) {
      throw new Error("Mistral API hat leeren Inhalt zurückgegeben");
    }
    
    // Add LinkedIn reference with student-friendly context if not present and linkedInPage is provided
    if (linkedInPage && !content.includes("linkedin.com/company/linkit-karlsruhe")) {
      content += `\n\n---\n\n**Bleibt connected! 🤝**\nFür weitere Updates, Diskussionen und Community-Events folgt uns auf [LinkedIn](${linkedInPage}). Dort teilen wir auch Infos zu Workshops, Gastvorträgen und Networking-Möglichkeiten!`;
    }

    console.log('🎉 Newsletter generated successfully via Mistral');
    return new Response(
      JSON.stringify({ content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("💥 Error generating newsletter:", error);
    console.error("💥 Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'No stack'
    });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating newsletter';
    return new Response(
      JSON.stringify({ 
        error: `Fehler bei der Newsletter-Generierung: ${errorMessage}`,
        details: "Überprüfen Sie die Browser-Konsole für weitere Details",
        provider: "mistral",
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateArticleSummary(apiKey: string, data: any) {
  const { article } = data;

  if (!article || !article.title) {
    return new Response(
      JSON.stringify({ error: "article mit title ist ein Pflichtfeld" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Generating summary for article:', article.title);
  console.log('Article content available:', !!article.content);
  console.log('Article description:', article.description?.substring(0, 100));
  
  const articleContent = article.content || article.description || 'Nur Titel verfügbar';
  const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 1000);

  const prompt = `Du hilfst Studierenden einer KI und Data Science Hochschulgruppe beim Verstehen von tech-Artikeln von "The Decoder" und ähnlichen KI-News-Quellen. 

WICHTIG: Verwende nur Informationen aus dem bereitgestellten Artikel. Erfinde keine Details oder Verbindungen, die nicht explizit erwähnt werden.

Fasse diesen deutschen KI-Artikel in 2-3 prägnanten Sätzen zusammen und erkläre kurz, warum er für Studierende relevant ist:
              
**Titel:** ${article.title}
**Quelle:** ${article.sourceName || 'The Decoder'}
**Inhalt/Beschreibung:** ${cleanContent}
**Link:** ${article.link}

**Aufgabe:**
1. Erstelle eine präzise 2-3 Satz Zusammenfassung des TATSÄCHLICHEN Artikelinhalts
2. Erkläre die praktische Relevanz für KI/Data Science Studierende
3. Verwende einen lockeren, studentenfreundlichen Ton
4. Bleibe bei den Fakten aus dem Artikel - erfinde nichts dazu

Stil: Faktisch korrekt, wissenschaftlich aber zugänglich, direkt und studentenfreundlich. Fokus auf praktische Anwendungen im Studium, aber nur basierend auf den tatsächlichen Inhalten des Artikels.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium-latest",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 300,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
      throw new Error("Unerwartete Antwort von der Mistral API");
    }

    const summary = responseData.choices[0].message.content;
    console.log('Generated summary:', summary.substring(0, 100));

    return new Response(
      JSON.stringify({ summary }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error generating article summary:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error generating summary';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function improveArticleTitle(apiKey: string, data: any) {
  const { article } = data;

  if (!article || !article.title) {
    return new Response(
      JSON.stringify({ error: "article mit title ist ein Pflichtfeld" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Improving title for article:', article.title);

  const prompt = `Du hilfst dabei, Artikel-Titel für eine deutsche KI und Data Science Hochschulgruppe zu verbessern.

Verbessere den folgenden Artikel-Titel, damit er für deutsche KI/Data Science Studierende ansprechender und verständlicher wird:

**Aktueller Titel:** ${article.title}
**Quelle:** ${article.sourceName || 'Unbekannt'}
**Link:** ${article.link}
${article.description ? `**Beschreibung:** ${article.description.substring(0, 200)}...` : ''}

**Aufgabe:**
1. Erstelle einen verbesserten deutschen Titel (max. 80 Zeichen)
2. Der Titel soll technisch korrekt aber studentenfreundlich sein
3. Verwende klare, präzise Sprache ohne Clickbait
4. Fokussiere auf die praktische Relevanz für KI/Data Science Studierende
5. Behebe sprachliche Fehler oder unklare Formulierungen

**Stil:** Professionell aber zugänglich, direkt und informativ. Der Titel soll das Interesse wecken ohne zu übertreiben.

Antworte nur mit dem verbesserten Titel, ohne zusätzliche Erklärungen oder Anführungszeichen.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium-latest",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 100,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
      throw new Error("Unerwartete Antwort von der Mistral API");
    }

    const improvedTitle = responseData.choices[0].message.content.trim();
    console.log('Improved title generated:', improvedTitle.substring(0, 50));

    return new Response(
      JSON.stringify({ improvedTitle }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error improving article title:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error improving title';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function translateTitleToEnglish(apiKey: string, data: any) {
  const { article } = data;

  if (!article || !article.title) {
    return new Response(
      JSON.stringify({ error: "article mit title ist ein Pflichtfeld" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Translating title to English for article:', article.title);

  const prompt = `You are helping to translate German AI and Data Science article titles to English for international students.

Translate the following German article title to English:

**German Title:** ${article.title}
**Source:** ${article.sourceName || 'Unknown'}
**Link:** ${article.link}
${article.description ? `**Description:** ${article.description.substring(0, 200)}...` : ''}

**Task:**
1. Create an accurate English translation (max. 80 characters)
2. Keep technical terms precise and correct
3. Make it clear and engaging for AI/Data Science students
4. Maintain the original meaning while making it natural in English
5. Use professional but accessible language

**Style:** Professional but accessible, direct and informative. The title should be engaging without being clickbait.

Respond only with the translated English title, without additional explanations or quotation marks.`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-medium-latest",
        messages: [{
          role: "user",
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 100,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Mistral API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message || !responseData.choices[0].message.content) {
      throw new Error("Unerwartete Antwort von der Mistral API");
    }

    const translatedTitle = responseData.choices[0].message.content.trim();
    console.log('Title translated to English:', translatedTitle.substring(0, 50));

    return new Response(
      JSON.stringify({ translatedTitle }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error("Error translating title to English:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error translating title';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: 'mistral-medium-latest',
        messages: [{ 
          role: 'user', 
          content: prompt 
        }],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => null);
      throw new Error(`Mistral API Fehler: ${response.status} - ${errData?.error?.message || response.statusText}`);
    }

    const respData = await response.json();
    const content = respData.choices?.[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error qa-with-newsletter:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error in QA';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
} 