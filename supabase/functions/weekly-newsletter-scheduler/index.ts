/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyDigest {
  id: string;
  weekNumber: number;
  year: number;
  dateRange: string;
  title: string;
  summary: string;
  items: any[];
  createdAt: Date;
}

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate?: string;
  source?: string;
  content?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== WEEKLY NEWSLETTER SCHEDULER TRIGGERED ===')
    
    // Get current date and check if it's Sunday
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    console.log(`Current time: ${now.toISOString()}, Day: ${dayOfWeek}, Hour: ${hour}, Minute: ${minute}`)
    
    // Check if it's Sunday (0) at 23:59
    const isSunday = dayOfWeek === 0
    const isScheduledTime = hour === 23 && minute >= 59
    
    // For testing purposes, also allow manual trigger
    const isManualTrigger = req.url.includes('manual=true')
    
    if (!isSunday || !isScheduledTime) {
      if (!isManualTrigger) {
        console.log('Not the scheduled time for automatic newsletter generation')
        return new Response(
          JSON.stringify({ 
            message: 'Scheduled for Sundays at 23:59',
            currentTime: now.toISOString(),
            dayOfWeek,
            hour,
            minute
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200
          }
        )
      }
    }

    console.log('Proceeding with automatic newsletter generation...')

    // Get current week and year
    const getCurrentWeek = (date: Date): number => {
      const startDate = new Date(date.getFullYear(), 0, 1)
      const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
      return Math.ceil((days + startDate.getDay() + 1) / 7)
    }

    const weekNumber = getCurrentWeek(now)
    const year = now.getFullYear()

    console.log(`Generating newsletter for week ${weekNumber}/${year}`)

    // Initialize Supabase client (in Edge Functions, this is available globally)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    // Check if newsletter for this week already exists
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_archive?week_number=eq.${weekNumber}&year=eq.${year}`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    })

    const existingNewsletters = await checkResponse.json()

    if (existingNewsletters && existingNewsletters.length > 0) {
      console.log('Newsletter for this week already exists, skipping generation')
      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Newsletter for week ${weekNumber}/${year} already exists`,
          existing: true,
          newsletter: existingNewsletters[0]
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      )
    }

    // Fetch latest news articles
    console.log('Fetching latest news articles...')
    
    const rssUrls = [
      'https://the-decoder.de/feed/'
    ]

    const allArticles: RssItem[] = []

    for (const rssUrl of rssUrls) {
      try {
        const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=lddts6gqitazbhgxzfgfypjyqffqjp2aumhrjmfp&count=20`
        
        const response = await fetch(rss2jsonUrl)
        const data = await response.json()
        
        if (data.status === 'ok' && data.items) {
          const articles = data.items.map((item: any) => ({
            title: item.title,
            description: item.description || '',
            link: item.link,
            pubDate: item.pubDate,
            source: data.feed?.title || 'Unknown',
            content: item.content || item.description || ''
          }))
          
          allArticles.push(...articles)
        }
      } catch (error) {
        console.error(`Error fetching from ${rssUrl}:`, error)
      }
    }

    console.log(`Fetched ${allArticles.length} articles total`)

    // Filter articles from the current week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const currentWeekArticles = allArticles.filter(article => {
      if (!article.pubDate) return false
      const articleDate = new Date(article.pubDate)
      return articleDate >= oneWeekAgo && articleDate <= now
    })

    console.log(`Filtered to ${currentWeekArticles.length} articles from current week`)

    if (currentWeekArticles.length === 0) {
      console.log('No articles found for current week')
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No articles found for current week',
          articlesTotal: allArticles.length,
          articlesCurrentWeek: 0
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      )
    }

    // Create digest object
    const getWeekDateRange = (week: number, year: number): string => {
      const firstDayOfYear = new Date(year, 0, 1)
      const daysOffset = (week - 1) * 7
      const startOfWeek = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000)
      
      // Adjust to Monday
      const dayOfWeek = startOfWeek.getDay()
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startOfWeek.setDate(startOfWeek.getDate() + mondayOffset)
      
      const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }
      
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
    }

    const digest: WeeklyDigest = {
      id: `${year}-W${weekNumber}`,
      weekNumber,
      year,
      dateRange: getWeekDateRange(weekNumber, year),
      title: `KI-Update KW ${weekNumber} · ${getWeekDateRange(weekNumber, year)}`,
      summary: `Die wichtigsten KI-Nachrichten der Woche ${weekNumber}`,
      items: currentWeekArticles,
      createdAt: now
    }

    // Generate newsletter content using Gemini
    console.log('Generating newsletter content with Gemini...')
    
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables')
    }

    const prompt = `🚨 KRITISCHE REGEL: Du darfst AUSSCHLIESSLICH die folgenden ${currentWeekArticles.length} echten Artikel verwenden!

VERFÜGBARE ECHTE ARTIKEL (${currentWeekArticles.length} Stück):
${currentWeekArticles.map((article, index) => `
═══ ARTIKEL ${index + 1} ═══
Titel: ${article.title}
Link: ${article.link}
Quelle: ${article.source}
Datum: ${article.pubDate}
Inhalt: ${article.content?.substring(0, 600)}...
═════════════════════════
`).join('\n')}

🚫 STRIKT VERBOTEN - NICHT ERFINDEN:
❌ Stanford-Kurse oder Links
❌ Kaggle-Kurse oder Links  
❌ TUM-Studiengänge oder Links
❌ GitHub-Features oder Links
❌ PyTorch-Updates oder Links
❌ Jegliche anderen Quellen, Links oder Inhalte

⚠️ Falls nur wenige/keine Artikel verfügbar sind:
Schreibe "Diese Woche sind weniger KI-News aus unseren Quellen verfügbar" und nutze NUR die obigen ${currentWeekArticles.length} echten Artikel.

📝 AUFGABE:
Erstelle einen professionellen Newsletter im Markdown-Format für LINKIT Karlsruhe mit:
- Studentenfreundlichem, professionellem Ton
- Fokus auf KI, Data Science und Machine Learning  
- Struktur: Titel, Einleitung, Artikel-Zusammenfassungen, Abschluss
- Deutsche Sprache
- LinkedIn-Verweis: https://www.linkedin.com/company/linkit-karlsruhe/posts/?feedView=all

Verwende AUSSCHLIESSLICH die ${currentWeekArticles.length} echten Artikel von oben!`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.8,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const newsletterContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!newsletterContent) {
      throw new Error('No content generated by Gemini API')
    }

    console.log('Newsletter content generated successfully')

    // FIX 3: Link-Validierung gegen Halluzinationen
    const linkValidation = newsletterContent.match(/https?:\/\/[^\s\)\]]+/g) || []
    const allowedDomains = ['the-decoder.de', 'linkedin.com']
    const invalidLinks = linkValidation.filter(link => 
      !allowedDomains.some(domain => link.includes(domain))
    )

    if (invalidLinks.length > 0) {
      console.error('🚨 HALLUZINIERTE LINKS GEFUNDEN:', invalidLinks)
      console.error('🚨 Newsletter enthält erfundene Inhalte - wird trotzdem gespeichert aber markiert')
      
      // Warnung zum Newsletter-Content hinzufügen
      const warningNote = `\n\n---\n⚠️ **SYSTEM-WARNUNG**: Dieser Newsletter könnte halluzinierte Links enthalten: ${invalidLinks.join(', ')}\n---`
      
      // Newsletter mit Warnung speichern
      const finalContent = newsletterContent + warningNote
    } else {
      console.log('✅ Alle Links validiert - keine Halluzinationen gefunden')
    }

    // Save to newsletter_archive
    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_archive`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        week_number: weekNumber,
        year: year,
        date_range: digest.dateRange,
        title: `LINKIT WEEKLY - KW ${weekNumber}/${year}`,
        content: invalidLinks.length > 0 ? newsletterContent + `\n\n---\n⚠️ **SYSTEM-WARNUNG**: Mögliche halluzinierte Links: ${invalidLinks.join(', ')}\n---` : newsletterContent,
        article_count: currentWeekArticles.length
      })
    })

    if (!saveResponse.ok) {
      const errorText = await saveResponse.text()
      throw new Error(`Error saving newsletter: ${saveResponse.status} - ${errorText}`)
    }

    const savedNewsletter = await saveResponse.json()

    console.log(`Newsletter successfully saved with ID: ${savedNewsletter[0]?.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Newsletter für KW ${weekNumber}/${year} automatisch generiert und gespeichert`,
        newsletter: savedNewsletter[0],
        articlesProcessed: currentWeekArticles.length,
        isManualTrigger
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error: unknown) {
    console.error('Error in weekly newsletter scheduler:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Weekly newsletter scheduler failed'
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
}) 