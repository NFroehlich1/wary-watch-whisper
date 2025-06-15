/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== CRON TRIGGER: CHECKING FOR SCHEDULED TASKS ===')
    
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Sunday
    const hour = now.getHours()
    const minute = now.getMinutes()
    
    console.log(`Current time: ${now.toISOString()}, Day: ${dayOfWeek}, Hour: ${hour}, Minute: ${minute}`)
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const results = []
    
    // Check for daily article processing (every day at 8:00, 14:00, 20:00)
    const shouldProcessArticles = hour === 8 || hour === 14 || hour === 20
    
    if (shouldProcessArticles && minute < 5) {
      console.log('=== TRIGGERING DAILY ARTICLE PROCESSING ===')
      
      try {
        const articleResponse = await fetch(`${supabaseUrl}/functions/v1/daily-article-processor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sources: ['https://the-decoder.de/feed/'],
            maxArticlesPerSource: 15,
            enableAiScoring: true,
            forceRefresh: false
          })
        })

        const articleResult = await articleResponse.json()
        results.push({
          type: 'daily-articles',
          success: articleResponse.ok,
          result: articleResult,
          time: hour
        })
        
        console.log('Daily article processing result:', articleResult)
      } catch (error) {
        console.error('Error in daily article processing:', error)
        results.push({
          type: 'daily-articles',
          success: false,
          error: error.message,
          time: hour
        })
      }
    }
    
    // Check for weekly newsletter generation (Sunday at 23:59)
    const shouldTriggerNewsletter = dayOfWeek === 0 && hour === 23 && minute >= 59
    
    if (shouldTriggerNewsletter) {
      console.log('=== TRIGGERING WEEKLY NEWSLETTER GENERATION ===')
      
      try {
        const schedulerResponse = await fetch(`${supabaseUrl}/functions/v1/weekly-newsletter-scheduler`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trigger: 'cron' })
        })

        const schedulerResult = await schedulerResponse.json()
        results.push({
          type: 'weekly-newsletter',
          success: schedulerResponse.ok,
          result: schedulerResult
        })
        
        console.log('Newsletter scheduler result:', schedulerResult)
      } catch (error) {
        console.error('Error in newsletter generation:', error)
        results.push({
          type: 'weekly-newsletter',
          success: false,
          error: error.message
        })
      }
    }
    
    // If no tasks were triggered
    if (results.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No scheduled tasks triggered at this time',
          currentTime: now.toISOString(),
          nextArticleProcessing: 'Daily at 8:00, 14:00, 20:00 UTC',
          nextNewsletter: 'Sunday 23:59 UTC',
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

    return new Response(
      JSON.stringify({
        success: true,
        message: `Triggered ${results.length} scheduled task(s)`,
        results,
        timestamp: now.toISOString()
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error: unknown) {
    console.error('Error in cron trigger:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: 'Cron trigger failed'
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    )
  }
}) 