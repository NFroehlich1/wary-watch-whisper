import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== DAILY ARTICLE PROCESSOR STARTED ===");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request parameters
    const { sources, maxArticlesPerSource = 10, enableAiScoring = true, forceRefresh = false } = await req.json();
    
    const defaultSources = [
      "https://the-decoder.de/feed/",
      "https://feeds.feedburner.com/oreilly/radar",
      "https://techcrunch.com/category/artificial-intelligence/feed/"
    ];
    
    const rssSources = sources || defaultSources;
    
    console.log(`Processing ${rssSources.length} RSS sources with AI scoring: ${enableAiScoring}`);

    const today = new Date().toISOString().split('T')[0];
    let allProcessedArticles = [];
    let totalNewArticles = 0;
    let aiScoredCount = 0;

    // Process each RSS source
    for (const sourceUrl of rssSources) {
      try {
        console.log(`\n--- Processing source: ${sourceUrl} ---`);
        
        // Fetch articles from RSS with AI scoring
        const rssResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-rss`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ 
            url: sourceUrl,
            enableAiScoring: enableAiScoring
          })
        });

        if (!rssResponse.ok) {
          throw new Error(`RSS fetch failed: ${rssResponse.status}`);
        }

        const rssData = await rssResponse.json();
        
        if (!rssData.success || !rssData.articles) {
          throw new Error("Invalid RSS response");
        }

        console.log(`Fetched ${rssData.articles.length} articles from ${rssData.source_name}`);
        
        // Take top articles by score, limited by maxArticlesPerSource
        const topArticles = rssData.articles
          .sort((a, b) => (b.ml_relevance_score || 0) - (a.ml_relevance_score || 0))
          .slice(0, maxArticlesPerSource);

        // Store articles in database
        for (const article of topArticles) {
          try {
            // Check if article already exists (by URL or GUID)
            const { data: existingArticle } = await supabase
              .from('daily_raw_articles')
              .select('id')
              .or(`link.eq.${article.link},guid.eq.${article.guid}`)
              .single();

            if (existingArticle && !forceRefresh) {
              console.log(`Article already exists: ${article.title.substring(0, 50)}...`);
              continue;
            }

            // Prepare article data for database
            const articleData = {
              title: article.title,
              link: article.link,
              description: article.description || '',
              pub_date: article.pubDate,
              guid: article.guid,
              creator: article.creator || 'Unknown',
              categories: article.categories || [],
              content: article.content || '',
              image_url: article.imageUrl,
              source_name: article.sourceName,
              source_url: sourceUrl,
              
              // ML/DS Scoring data
              ml_relevance_score: article.ml_relevance_score || 0,
              ds_relevance_score: article.ml_relevance_score || 0, // Use same score for now
              student_priority: article.student_priority || false,
              ai_reasoning: article.ai_reasoning || '',
              ai_categories: article.ai_categories || [],
              
              // Metadata
              fetch_date: today,
              ai_scored: article.ai_scored || false,
              scoring_error: article.scoring_error || false,
              keyword_score_details: article.keyword_score_details || null
            };

            // Insert or update article
            const { data: savedArticle, error } = existingArticle && forceRefresh
              ? await supabase
                  .from('daily_raw_articles')
                  .update(articleData)
                  .eq('id', existingArticle.id)
                  .select()
                  .single()
              : await supabase
                  .from('daily_raw_articles')
                  .insert(articleData)
                  .select()
                  .single();

            if (error) {
              console.error(`Error saving article: ${error.message}`);
              continue;
            }

            allProcessedArticles.push(savedArticle);
            totalNewArticles++;
            
            if (article.ai_scored) {
              aiScoredCount++;
            }

            console.log(`✅ Saved: ${article.title.substring(0, 50)}... (Score: ${article.ml_relevance_score})`);

          } catch (articleError) {
            console.error(`Error processing individual article: ${articleError.message}`);
          }
        }

      } catch (sourceError) {
        console.error(`Error processing source ${sourceUrl}: ${sourceError.message}`);
      }
    }

    // Rank today's articles
    if (totalNewArticles > 0) {
      await rankTodaysArticles(supabase, today);
    }

    // Generate daily summary
    const topArticles = allProcessedArticles
      .sort((a, b) => (b.ml_relevance_score || 0) - (a.ml_relevance_score || 0))
      .slice(0, 10);

    const summary = {
      date: today,
      total_sources_processed: rssSources.length,
      total_articles_processed: totalNewArticles,
      ai_scored_articles: aiScoredCount,
      keyword_scored_articles: totalNewArticles - aiScoredCount,
      high_priority_articles: allProcessedArticles.filter(a => a.student_priority).length,
      top_article: topArticles[0] ? {
        title: topArticles[0].title,
        score: topArticles[0].ml_relevance_score,
        source: topArticles[0].source_name
      } : null,
      average_score: totalNewArticles > 0 
        ? Math.round((allProcessedArticles.reduce((sum, a) => sum + (a.ml_relevance_score || 0), 0) / totalNewArticles) * 100) / 100
        : 0
    };

    console.log(`\n✅ PROCESSING COMPLETE:`);
    console.log(`- ${summary.total_articles_processed} articles processed`);
    console.log(`- ${summary.ai_scored_articles} AI scored, ${summary.keyword_scored_articles} keyword scored`);
    console.log(`- ${summary.high_priority_articles} high-priority articles`);
    console.log(`- Average score: ${summary.average_score}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Daily processing complete: ${summary.total_articles_processed} articles processed`,
        summary,
        top_articles: topArticles.map(a => ({
          title: a.title,
          score: a.ml_relevance_score,
          student_priority: a.student_priority,
          source: a.source_name,
          ai_scored: a.ai_scored
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error in daily-article-processor:", error);
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

// Rank today's articles and assign daily_rank
async function rankTodaysArticles(supabase: any, date: string) {
  console.log(`\n--- Ranking articles for ${date} ---`);
  
  try {
    // Get all articles for today, sorted by ML relevance score
    const { data: articles, error } = await supabase
      .from('daily_raw_articles')
      .select('id, ml_relevance_score, title')
      .eq('fetch_date', date)
      .order('ml_relevance_score', { ascending: false });

    if (error) {
      throw new Error(`Error fetching articles for ranking: ${error.message}`);
    }

    if (!articles || articles.length === 0) {
      console.log("No articles found for ranking");
      return;
    }

    // Update daily_rank for each article
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const rank = i + 1;

      const { error: updateError } = await supabase
        .from('daily_raw_articles')
        .update({ daily_rank: rank })
        .eq('id', article.id);

      if (updateError) {
        console.error(`Error updating rank for article ${article.id}: ${updateError.message}`);
      }
    }

    console.log(`✅ Ranked ${articles.length} articles for ${date}`);
    console.log(`Top 3: ${articles.slice(0, 3).map((a, i) => `${i+1}. ${a.title.substring(0, 40)}... (${a.ml_relevance_score})`).join(', ')}`);

  } catch (error) {
    console.error(`Error ranking articles: ${error.message}`);
  }
} 