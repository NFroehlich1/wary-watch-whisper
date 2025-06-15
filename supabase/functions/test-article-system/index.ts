import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== TESTING ARTICLE SYSTEM ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    console.log("🔄 Starting comprehensive article processing test...");

    // Test 1: Daily Article Processor
    console.log("\n--- Test 1: Daily Article Processor ---");
    const processorResponse = await fetch(`${supabaseUrl}/functions/v1/daily-article-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ 
        enableAiScoring: true,
        maxArticlesPerSource: 15,
        forceRefresh: true, // Force refresh for testing
        sources: [
          "https://the-decoder.de/feed/",
          "https://feeds.feedburner.com/oreilly/radar",
          "https://techcrunch.com/category/artificial-intelligence/feed/",
          "https://www.technologyreview.com/feed/"
        ]
      })
    });

    let processorResult = null;
    if (processorResponse.ok) {
      processorResult = await processorResponse.json();
      console.log(`✅ Processor: ${processorResult.summary?.total_articles_processed || 0} articles processed`);
      console.log(`   AI-scored: ${processorResult.summary?.ai_scored_articles || 0}`);
      console.log(`   High-priority: ${processorResult.summary?.high_priority_articles || 0}`);
      console.log(`   Average score: ${processorResult.summary?.average_score || 0}`);
    } else {
      console.log(`❌ Processor failed: ${processorResponse.status}`);
    }

    // Test 2: Newsletter Generation 
    console.log("\n--- Test 2: Newsletter Generation ---");
    const newsletterResponse = await fetch(`${supabaseUrl}/functions/v1/auto-generate-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({})
    });

    let newsletterResult = null;
    if (newsletterResponse.ok) {
      newsletterResult = await newsletterResponse.json();
      console.log(`✅ Newsletter: Generated with ${newsletterResult.articleCount || 0} articles`);
      console.log(`   Newsletter ID: ${newsletterResult.newsletterId || 'N/A'}`);
    } else {
      console.log(`❌ Newsletter failed: ${newsletterResponse.status}`);
    }

    // Test 3: Database Query
    console.log("\n--- Test 3: Database Stats ---");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date().toISOString().split('T')[0];
    const { data: todayArticles, error: todayError } = await supabase
      .from('daily_raw_articles')
      .select('id, title, ml_relevance_score, student_priority, ai_scored, source_name')
      .eq('fetch_date', today)
      .order('ml_relevance_score', { ascending: false });

    if (!todayError && todayArticles) {
      console.log(`✅ Database: ${todayArticles.length} articles for today`);
      console.log(`   AI-scored: ${todayArticles.filter(a => a.ai_scored).length}`);
      console.log(`   High-priority: ${todayArticles.filter(a => a.student_priority).length}`);
      
      if (todayArticles.length > 0) {
        console.log(`   Top article: "${todayArticles[0].title.substring(0, 60)}..." (Score: ${todayArticles[0].ml_relevance_score})`);
        
        // Show sources breakdown
        const sourceCounts = todayArticles.reduce((counts, article) => {
          counts[article.source_name] = (counts[article.source_name] || 0) + 1;
          return counts;
        }, {});
        console.log(`   Sources: ${Object.entries(sourceCounts).map(([source, count]) => `${source}: ${count}`).join(', ')}`);
      }
    } else {
      console.log(`❌ Database query failed: ${todayError?.message}`);
    }

    // Test 4: AI Scoring Test
    console.log("\n--- Test 4: AI Scoring Test ---");
    const testArticle = {
      title: "New PyTorch Tutorial for Machine Learning Beginners",
      description: "A comprehensive free tutorial covering PyTorch basics for university students starting their ML journey",
      content: "This tutorial covers neural networks, data loading, and practical exercises for students",
      sourceName: "Test Source"
    };

    const aiTestResponse = await fetch(`${supabaseUrl}/functions/v1/gemini-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ 
        action: 'relevance-score',
        data: { article: testArticle }
      })
    });

    if (aiTestResponse.ok) {
      const aiResult = await aiTestResponse.json();
      console.log(`✅ AI Scoring: Score ${aiResult.score}/10`);
      console.log(`   Reasoning: ${aiResult.reasoning}`);
      console.log(`   Student Priority: ${aiResult.student_priority}`);
      console.log(`   Categories: ${aiResult.categories?.join(', ')}`);
    } else {
      console.log(`❌ AI Scoring failed: ${aiTestResponse.status}`);
    }

    // Summary
    const summary = {
      timestamp: new Date().toISOString(),
      tests_completed: 4,
      daily_processor: {
        success: !!processorResult,
        articles_processed: processorResult?.summary?.total_articles_processed || 0,
        ai_scored: processorResult?.summary?.ai_scored_articles || 0
      },
      newsletter_generation: {
        success: !!newsletterResult,
        articles_used: newsletterResult?.articleCount || 0
      },
      database: {
        success: !todayError,
        total_articles_today: todayArticles?.length || 0,
        ai_scored_today: todayArticles?.filter(a => a.ai_scored).length || 0
      },
      ai_scoring: {
        success: aiTestResponse.ok
      }
    };

    console.log("\n🎯 TEST SUMMARY:");
    console.log(`✅ System working: ${Object.values(summary).filter(test => typeof test === 'object' ? test.success : true).length}/4 components`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Article system test completed",
        summary,
        recommendations: [
          processorResult?.summary?.total_articles_processed < 10 ? "Consider adding more RSS sources" : null,
          todayArticles?.filter(a => a.ai_scored).length < 5 ? "AI scoring may need optimization" : null,
          !newsletterResult ? "Newsletter generation needs attention" : null
        ].filter(Boolean)
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Test failed:", error);
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