import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== TESTING DECODER SYSTEM ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const results = {
      daily_processor: null,
      weekly_processor: null,
      timestamp: new Date().toISOString()
    };

    // Test 1: Daily Decoder Processor
    console.log("\n🔄 Testing Daily Decoder Processor...");
    try {
      const dailyResponse = await fetch(`${supabaseUrl}/functions/v1/daily-decoder-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });

      if (dailyResponse.ok) {
        const dailyResult = await dailyResponse.json();
        results.daily_processor = {
          success: true,
          new_articles: dailyResult.summary?.new_articles_saved || 0,
          total_today: dailyResult.summary?.total_articles_today || 0,
          top_10_count: dailyResult.summary?.top_10_selected || 0,
          average_score: dailyResult.summary?.average_score || 0,
          top_article: dailyResult.summary?.top_article?.title || 'N/A'
        };
        console.log(`✅ Daily: ${results.daily_processor.new_articles} new articles, top 10 selected`);
      } else {
        results.daily_processor = { success: false, error: `HTTP ${dailyResponse.status}` };
        console.log(`❌ Daily processor failed: ${dailyResponse.status}`);
      }
    } catch (error) {
      results.daily_processor = { success: false, error: error.message };
      console.log(`❌ Daily processor error: ${error.message}`);
    }

    // Test 2: Weekly Newsletter Processor
    console.log("\n📰 Testing Weekly Newsletter Processor...");
    try {
      const weeklyResponse = await fetch(`${supabaseUrl}/functions/v1/weekly-newsletter-processor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });

      if (weeklyResponse.ok) {
        const weeklyResult = await weeklyResponse.json();
        results.weekly_processor = {
          success: true,
          total_articles_reviewed: weeklyResult.summary?.total_articles_reviewed || 0,
          final_top_10: weeklyResult.summary?.final_top_10_selected || 0,
          average_score: weeklyResult.summary?.average_score_top_10 || 0,
          newsletter_id: weeklyResult.summary?.newsletter_id || 'N/A',
          existing: weeklyResult.existing || false
        };
        console.log(`✅ Weekly: ${results.weekly_processor.total_articles_reviewed} articles reviewed, newsletter generated`);
      } else {
        results.weekly_processor = { success: false, error: `HTTP ${weeklyResponse.status}` };
        console.log(`❌ Weekly processor failed: ${weeklyResponse.status}`);
      }
    } catch (error) {
      results.weekly_processor = { success: false, error: error.message };
      console.log(`❌ Weekly processor error: ${error.message}`);
    }

    // Summary
    const successfulTests = [
      results.daily_processor?.success,
      results.weekly_processor?.success
    ].filter(Boolean).length;

    console.log(`\n🎯 TEST RESULTS: ${successfulTests}/2 components working`);

    if (results.daily_processor?.success) {
      console.log(`📈 Daily: ${results.daily_processor.new_articles} new articles processed today`);
    }

    if (results.weekly_processor?.success) {
      console.log(`📊 Weekly: ${results.weekly_processor.total_articles_reviewed} articles from week, final top 10 selected`);
    }

    return new Response(
      JSON.stringify({ 
        success: successfulTests === 2, 
        message: `Decoder system test complete: ${successfulTests}/2 components working`,
        results,
        recommendations: [
          !results.daily_processor?.success ? "Daily processor needs attention" : null,
          !results.weekly_processor?.success ? "Weekly processor needs attention" : null,
          results.daily_processor?.new_articles === 0 ? "No new articles found (may be normal if already processed today)" : null
        ].filter(Boolean)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Test system failed:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Test execution failed", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 