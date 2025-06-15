/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface RequestData {
  action: 'search' | 'qa';
  query: string;
  yearFilter?: number;
  weekFilter?: number;
  limit?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!

    if (!supabaseUrl || !serviceRoleKey || !geminiApiKey) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { action, query, yearFilter, weekFilter, limit = 10 }: RequestData = await req.json()

    if (!action || !query) {
      throw new Error('Action and query are required')
    }

    // Build search query
    let dbQuery = supabase
      .from('newsletter_archive')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filters
    if (yearFilter) {
      dbQuery = dbQuery.eq('year', yearFilter)
    }
    if (weekFilter) {
      dbQuery = dbQuery.eq('week_number', weekFilter)
    }

    const { data: newsletters, error: searchError } = await dbQuery

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`)
    }

    if (action === 'search') {
      return new Response(
        JSON.stringify({ 
          newsletters,
          count: newsletters?.length || 0,
          query: query 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'qa') {
      // Combine relevant newsletters for Q&A
      const context = newsletters?.map(nl => 
        `Newsletter ${nl.year}/KW${nl.week_number}: ${nl.title}\n${nl.content.substring(0, 2000)}`
      ).join('\n\n---\n\n') || ''

      if (!context) {
        return new Response(
          JSON.stringify({ 
            answer: 'Entschuldigung, ich konnte keine relevanten Newsletter zu Ihrer Frage finden.',
            newsletters: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const prompt = `Du bist ein hilfsbereiter deutschsprachiger KI-Assistent für Studierende.

AUFGABE: Beantworte die folgende Frage basierend auf den bereitgestellten Newsletter-Archiven.

NUTZER-FRAGE: "${query}"

NEWSLETTER-ARCHIVE ZUR REFERENZ:
${context}

ANWEISUNGEN:
1. Beantworte die Frage präzise und hilfreich auf Deutsch
2. Verwende nur Informationen aus den bereitgestellten Newsletter-Archiven
3. Zitiere relevante Newsletter mit Jahr/Woche (z.B. "Laut Newsletter 2024/KW15...")
4. Falls die Information nicht in den Archiven vorhanden ist, sage das ehrlich
5. Strukturiere deine Antwort klar und verständlich
6. Füge am Ende eine kurze Liste der referenzierten Newsletter hinzu

Stil: Akademisch aber zugänglich, hilfreich und faktenbezogen.`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048
            }
          })
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(`Gemini API Error: ${response.status} - ${errorData?.error?.message || response.statusText}`)
      }

      const geminiData = await response.json()
      const answer = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Keine Antwort generiert'

      return new Response(
        JSON.stringify({ 
          answer,
          newsletters: newsletters?.slice(0, 5), // Return top 5 relevant newsletters
          totalFound: newsletters?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action specified')

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 