import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== DAILY DECODER PROCESSOR STARTED ===");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Processing The Decoder articles for ${today}`);

    // Step 1: Fetch all articles from The Decoder RSS
    console.log("\n--- Fetching The Decoder RSS ---");
    const rssResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-rss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ 
        url: "https://the-decoder.de/feed/",
        enableAiScoring: true
      })
    });

    if (!rssResponse.ok) {
      throw new Error(`RSS fetch failed: ${rssResponse.status}`);
    }

    const rssData = await rssResponse.json();
    
    if (!rssData.success || !rssData.articles) {
      throw new Error("Invalid RSS response");
    }

    console.log(`✅ Fetched ${rssData.articles.length} articles from The Decoder`);
    
    // Step 2: Filter for today's articles and remove duplicates
    const todayArticles = [];
    
    for (const article of rssData.articles) {
      // Check if article already exists
      const { data: existingArticle } = await supabase
        .from('daily_raw_articles')
        .select('id')
        .or(`link.eq.${article.link},guid.eq.${article.guid}`)
        .single();

      if (existingArticle) {
        console.log(`⏭️  Article already exists: ${article.title.substring(0, 40)}...`);
        continue;
      }

      // Prepare article data
      const articleData = {
        title: article.title,
        link: article.link,
        description: article.description || '',
        pub_date: article.pubDate,
        guid: article.guid,
        creator: article.creator || 'The Decoder',
        categories: article.categories || [],
        content: article.content || '',
        image_url: article.imageUrl,
        source_name: 'The Decoder',
        source_url: "https://the-decoder.de/feed/",
        
        // AI Scoring results
        ml_relevance_score: article.ml_relevance_score || 0,
        ds_relevance_score: article.ml_relevance_score || 0,
        student_priority: article.student_priority || false,
        ai_reasoning: article.ai_reasoning || '',
        ai_categories: article.ai_categories || [],
        
        // Metadata
        fetch_date: today,
        ai_scored: article.ai_scored || false,
        scoring_error: article.scoring_error || false,
        keyword_score_details: article.keyword_score_details || null
      };

      // Save to database
      const { data: savedArticle, error } = await supabase
        .from('daily_raw_articles')
        .insert(articleData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error saving article: ${error.message}`);
        continue;
      }

      todayArticles.push(savedArticle);
      console.log(`✅ Saved: ${article.title.substring(0, 50)}... (Score: ${article.ml_relevance_score})`);
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`- ${rssData.articles.length} articles fetched from RSS`);
    console.log(`- ${todayArticles.length} new articles saved to database`);

    // Step 3: Get all articles for today and rank them
    const { data: allTodayArticles, error: queryError } = await supabase
      .from('daily_raw_articles')
      .select('*')
      .eq('fetch_date', today)
      .eq('source_name', 'The Decoder')
      .order('ml_relevance_score', { ascending: false });

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    console.log(`\n🎯 Total articles for today: ${allTodayArticles?.length || 0}`);

    // Step 4: Select and rank top 10 for today
    const top10Today = (allTodayArticles || []).slice(0, 10);
    
    // Update daily_rank for top 10
    for (let i = 0; i < top10Today.length; i++) {
      const article = top10Today[i];
      const rank = i + 1;

      const { error: updateError } = await supabase
        .from('daily_raw_articles')
        .update({ daily_rank: rank })
        .eq('id', article.id);

      if (updateError) {
        console.error(`Error updating rank for article ${article.id}: ${updateError.message}`);
      }
    }

    // Step 5: Generate summary
    const summary = {
      date: today,
      source: 'The Decoder',
      total_articles_fetched: rssData.articles.length,
      new_articles_saved: todayArticles.length,
      total_articles_today: allTodayArticles?.length || 0,
      top_10_selected: top10Today.length,
      ai_scored_articles: todayArticles.filter(a => a.ai_scored).length,
      high_priority_articles: todayArticles.filter(a => a.student_priority).length,
      average_score: todayArticles.length > 0 
        ? Math.round((todayArticles.reduce((sum, a) => sum + (a.ml_relevance_score || 0), 0) / todayArticles.length) * 100) / 100
        : 0,
      top_article: top10Today[0] ? {
        title: top10Today[0].title,
        score: top10Today[0].ml_relevance_score,
        student_priority: top10Today[0].student_priority
      } : null
    };

    console.log(`\n🏆 DAILY TOP 10 SELECTED:`);
    top10Today.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title.substring(0, 60)}... (Score: ${article.ml_relevance_score})`);
    });

    console.log(`\n📈 Daily Stats:`);
    console.log(`- Average Score: ${summary.average_score}`);
    console.log(`- AI-Scored: ${summary.ai_scored_articles}/${summary.new_articles_saved}`);
    console.log(`- High-Priority: ${summary.high_priority_articles}/${summary.new_articles_saved}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily processing complete: ${summary.new_articles_saved} new articles, top 10 ranked`,
        summary,
        top_10_today: top10Today.map((article, index) => ({
          rank: index + 1,
          title: article.title,
          score: article.ml_relevance_score,
          student_priority: article.student_priority,
          ai_scored: article.ai_scored,
          link: article.link
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error in daily-decoder-processor:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Daily processing failed", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}); 