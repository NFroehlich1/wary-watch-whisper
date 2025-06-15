# 🚀 Edge Function Deployment Guide

## Vollständiger Code für `gemini-ai` Edge Function

Da die CLI Probleme hat, können Sie die Edge Function manuell über das Supabase Dashboard deployen:

## ⚠️ **WICHTIG: API-Key Setup zuerst!**

### **0. GEMINI_API_KEY konfigurieren** 
**Bevor Sie die Edge Function deployen, stellen Sie sicher, dass der GEMINI_API_KEY gesetzt ist:**

1. **Supabase Dashboard** → Ihr Projekt (`aggkhetcdjmggqjzelgd`)
2. **Settings** → **Environment Variables** 
3. **Prüfen Sie, ob `GEMINI_API_KEY` bereits existiert**
4. **Falls nicht**: Fügen Sie ihn hinzu:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Ihr Google Gemini API Schlüssel
   - **Scope**: Edge Functions

### 1. **Supabase Dashboard öffnen**
- Gehen Sie zu: https://supabase.com/dashboard
- Wählen Sie Ihr Projekt aus
- Navigieren Sie zu "Edge Functions"

### 2. **gemini-ai Function bearbeiten**
- Klicken Sie auf "gemini-ai" 
- Oder erstellen Sie eine neue Function mit dem Namen "gemini-ai"

### 3. **Folgenden Code einsetzen:**

```typescript
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
      
      case 'relevance-score':
        return await generateRelevanceScore(geminiApiKey, data);
      
      case 'explain-relevance-score':
        return await explainRelevanceScore(geminiApiKey, data);
      
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
      JSON.stringify({ error: error.message }), 
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
      JSON.stringify({ isValid: false, message: `Verbindungsfehler: ${error.message}` }), 
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

**STRENGE REGELN FÜR FAKTISCHE GENAUIGKEIT:**
- Verwende AUSSCHLIESSLICH Informationen aus den bereitgestellten Artikeln
- ERFINDE NIEMALS Bezüge zu spezifischen Universitätskursen oder Professoren
- ERFINDE NIEMALS technische Details, die nicht in den Artikeln stehen
- Wenn du Verbindungen zu Studieninhalten herstellst, bleibe allgemein ("in ML-Kursen", "bei Data Science Projekten")
- Nutze KEINE spezifischen Kursnamen wie "CS229" oder "Deep Learning Vorlesung"

**NEWSLETTER-STIL (natürlich und studentenfreundlich):**
- Beginne mit natürlichen, lockeren Begrüßungen wie "Hi!", "Was geht ab!", "Servus zusammen!", "Hey Leute!" oder einfach "Hey"
- VERMEIDE formelle Begrüßungen wie "Herzlichen Glückwunsch", "Willkommen zu unserem Newsletter" oder steife Formulierungen
- Schreibe direkt und persönlich ("ihr", "euch"), aber authentisch und entspannt
- Vermeide übertriebene Förmlichkeit oder Business-Sprache
- Sei enthusiastisch aber natürlich - wie ein Student, der anderen Studenten schreibt
- Fokus auf praktische Relevanz für das Studium

**STRUKTUR für KW ${digest.weekNumber}/${digest.year} (${digest.dateRange}):**

# 📬 LINKIT WEEKLY KW ${digest.weekNumber}
**Dein Update zu KI, Data Science und Industrie 4.0**

KW ${digest.weekNumber} · ${digest.dateRange}

**Intro mit natürlicher, lockerer Begrüßung:**
- Verwende eine entspannte, authentische Begrüßung (KEINE formellen Glückwünsche!)
- Kurzer, persönlicher Einstieg ohne Floskeln
- Was euch diese Woche erwartet

**Hauptteil - Artikel-Analysen (NUR basierend auf echten Inhalten):**
Für jeden Artikel:
- **Aussagekräftige Überschrift** mit dem Kern des Artikels
- 2-3 Absätze detaillierte Analyse der TATSÄCHLICHEN Inhalte
- **Warum das für euch relevant ist:** Praktische Bedeutung für Studierende
- Allgemeine Verbindungen zu Studieninhalten (OHNE spezifische Kursnamen)
- Mögliche Anwendungen in eigenen Projekten
- 👉 **Mehr dazu** [Link zum Artikel]

**Schlussteil:**
- Zusammenfassung der wichtigsten Erkenntnisse
- Lockerer Abschluss mit Community-Aufruf

**WICHTIGE STILELEMENTE:**
- Authentische, lockere Sprache ohne Förmlichkeiten oder steife Begrüßungen
- Erkläre KI-Konzepte verständlich, aber bleib bei den Fakten
- Erwähne Tools und Technologien nur, wenn sie in den Artikeln vorkommen
- Mindestens 1500-2000 Wörter für ausführliche Analysen
- Enthusiastischer aber faktenbasierter Ton wie unter Studierenden

**NEWSLETTER-INHALT basierend auf diesen Artikeln:**
${articleDetails}

WICHTIG: Bleibe strikt bei den Inhalten der bereitgestellten Artikel. Erfinde keine Details, Kurse oder technischen Zusammenhänge, die nicht explizit erwähnt werden! Verwende eine natürliche, studentische Begrüßung OHNE formelle Glückwünsche!`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 5000,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMessage = `Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`;
      throw new Error(errorMessage);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    let content = responseData.candidates[0].content.parts[0].text;
    
    if (!content || content.trim().length === 0) {
      throw new Error("Gemini API hat leeren Inhalt zurückgegeben");
    }
    
    if (linkedInPage && !content.includes("linkedin.com/company/linkit-karlsruhe")) {
      content += `\n\n---\n\n**Bleibt connected! 🤝**\nFür weitere Updates, Diskussionen und Community-Events folgt uns auf [LinkedIn](${linkedInPage}). Dort teilen wir auch Infos zu Workshops, Gastvorträgen und Networking-Möglichkeiten!`;
    }

    return new Response(
      JSON.stringify({ content }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating summary:", error);
    return new Response(
      JSON.stringify({ error: `Fehler bei der Newsletter-Generierung: ${error.message}` }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateArticleSummary(apiKey: string, data: any) {
  const { article } = data;
  
  console.log('Generating summary for article:', article.title);
  
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    const summary = responseData.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ summary }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating article summary:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function generateRelevanceScore(apiKey: string, data: any) {
  const { article } = data;
  
  console.log('Generating ML/DS relevance score for article:', article.title);
  
  const articleContent = article.content || article.description || article.title;
  const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 1500);
  
  const prompt = `Du bewertest KI- und Data Science-Artikel für eine studentische ML/DS Hochschulgruppe.

**AUFGABE:** Bewerte die Relevanz dieses Artikels für ML/Data Science Studierende auf einer Skala von 0-10.

**BEWERTUNGSKRITERIEN:**
- **Sehr hoch (8-10):** Praktische Tutorials, neue Tools/Frameworks, kostenlose Ressourcen für Studenten, Karriere-relevante Trends, Competition/Kaggle-bezogen, Paper-Implementierungen
- **Hoch (6-7):** Aktuelle ML/DS Entwicklungen, neue Modelle/Architekturen, Industry insights, Open-Source Projekte
- **Mittel (4-5):** Allgemeine KI-News, Unternehmens-Announcements mit tech relevance, Research updates
- **Niedrig (1-3):** Business/Investment-News, rein theoretische Inhalte ohne praktischen Bezug, nicht-tech-fokussierte Artikel
- **Irrelevant (0):** Völlig unrelated zu ML/DS/KI

**FOKUS FÜR STUDENTEN:**
- Praktische Anwendbarkeit im Studium
- Kostenlose Tools und Ressourcen
- Lernmaterialien und Tutorials
- Karriere- und Skill-Entwicklung
- Hands-on Projekte und Competitions
- Open Source und Community-driven content

**ARTIKEL ZU BEWERTEN:**
Titel: "${article.title}"
Quelle: "${article.sourceName || 'Unbekannt'}"
Inhalt: "${cleanContent}"

**ANTWORT-FORMAT (JSON):**
Gib NUR ein gültiges JSON-Objekt zurück mit:
- score: number (0-10)
- reasoning: string (kurze Begründung in 1-2 Sätzen)
- student_priority: boolean (true wenn score >= 7)
- categories: array of strings (z.B. ["tutorial", "tools", "career", "research", "free-resource"])

Beispiel: {"score": 8, "reasoning": "Praktisches Tutorial für PyTorch mit direkter Anwendung in Studierenden-Projekten", "student_priority": true, "categories": ["tutorial", "tools"]}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 10,
          topP: 0.8,
          maxOutputTokens: 200,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    let aiResponse = responseData.candidates[0].content.parts[0].text;
    
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }
    
    let scoring;
    try {
      scoring = JSON.parse(aiResponse);
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON, using fallback scoring');
      scoring = {
        score: 5,
        reasoning: "AI-Antwort konnte nicht geparst werden",
        student_priority: false,
        categories: ["unknown"],
        raw_response: aiResponse
      };
    }

    scoring.score = Math.max(0, Math.min(10, Number(scoring.score) || 0));
    scoring.student_priority = scoring.score >= 7;
    scoring.categories = Array.isArray(scoring.categories) ? scoring.categories : ["unknown"];
    
    console.log(`AI Relevance Score: ${scoring.score}/10 for "${article.title}"`);

    return new Response(
      JSON.stringify(scoring), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating relevance score:", error);
    
    const fallbackScore = {
      score: 3,
      reasoning: `Fehler bei AI-Bewertung: ${error.message}`,
      student_priority: false,
      categories: ["error"],
      error: true
    };
    
    return new Response(
      JSON.stringify(fallbackScore), 
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function explainRelevanceScore(apiKey: string, data: any) {
  const { article } = data;
  
  console.log('Generating explanation for relevance score for article:', article.title);
  
  const articleContent = article.content || article.description || article.title;
  const cleanContent = articleContent.replace(/<[^>]*>/g, '').substring(0, 1500);
  
  const prompt = `Erkläre detailliert die Relevanz dieses Artikels für ML/Data Science Studierende.

**BEWERTUNGSKRITERIEN:**
- **Sehr hoch (8-10):** Praktische Tutorials, neue Tools/Frameworks, kostenlose Ressourcen für Studenten, Karriere-relevante Trends, Competition/Kaggle-bezogen, Paper-Implementierungen
- **Hoch (6-7):** Aktuelle ML/DS Entwicklungen, neue Modelle/Architekturen, Industry insights, Open-Source Projekte
- **Mittel (4-5):** Allgemeine KI-News, Unternehmens-Announcements mit tech relevance, Research updates
- **Niedrig (1-3):** Business/Investment-News, rein theoretische Inhalte ohne praktischen Bezug, nicht-tech-fokussierte Artikel
- **Irrelevant (0):** Völlig unrelated zu ML/DS/KI

**FOKUS FÜR STUDENTEN:**
- Praktische Anwendbarkeit im Studium
- Kostenlose Tools und Ressourcen
- Lernmaterialien und Tutorials
- Karriere- und Skill-Entwicklung
- Hands-on Projekte und Competitions
- Open Source und Community-driven content

**ARTIKEL ZU ERKLÄREN:**
Titel: "${article.title}"
Quelle: "${article.sourceName || 'Unbekannt'}"
Inhalt: "${cleanContent}"

Erstelle eine ausführliche, studentenfreundliche Erklärung (3-4 Sätze), warum dieser Artikel für ML/Data Science Studenten relevant oder weniger relevant ist. Erkläre konkret:
1. Welche Aspekte für Studenten nützlich sind
2. Wie es im Studium angewendet werden kann
3. Warum der Score gerechtfertigt ist
4. Was Studenten daraus lernen können

Schreibe im direkten, studentenfreundlichen Ton ("Das hilft euch bei...", "Für euer Studium bedeutet das...")`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 400,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Gemini API Fehler: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const responseData = await response.json();
    
    if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content || !responseData.candidates[0].content.parts || !responseData.candidates[0].content.parts[0]) {
      throw new Error("Unerwartete Antwort von der Gemini API");
    }

    const explanation = responseData.candidates[0].content.parts[0].text;
    console.log('Generated explanation:', explanation.substring(0, 100));

    return new Response(
      JSON.stringify({ explanation }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error generating relevance score explanation:", error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}
```

### 4. **Deploy klicken**
- Speichern und deployen Sie die Function
- Die neue `explain-relevance-score` Action ist jetzt verfügbar

## ✅ **Neue Funktionalität:**

- **Klickbare Scores** mit Info-Icon
- **AI-generierte Erklärungen** für Score-Begründungen  
- **Studentenspezifische Bewertungskriterien**
- **Popup-Dialog** mit detaillierter Begründung
- **Intelligente Sortierung** nach Relevanz-Score

Die Edge Function unterstützt jetzt die neue `explain-relevance-score` Action, die detaillierte, studentenfreundliche Erklärungen für die Score-Vergabe liefert! 