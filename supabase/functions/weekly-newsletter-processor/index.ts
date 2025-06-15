import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("=== WEEKLY NEWSLETTER PROCESSOR STARTED ===");
  
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

    // Get current week info
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getWeekNumber(now);
    const { weekStart, weekEnd, dateRange } = getWeekDateRange(currentWeek, currentYear);
    
    console.log(`Processing week ${currentWeek}/${currentYear} (${dateRange})`);

    // Check if newsletter for this week already exists
    const { data: existingNewsletter } = await supabase
      .from('newsletter_archive')
      .select('id')
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .single();

    if (existingNewsletter) {
      console.log(`Newsletter for week ${currentWeek}/${currentYear} already exists`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Newsletter für KW ${currentWeek}/${currentYear} bereits vorhanden`,
          existing: true 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Get all top 10 articles from each day of the week
    console.log(`\n--- Collecting daily top 10 articles from ${weekStart} to ${weekEnd} ---`);
    
    const { data: weeklyArticles, error: queryError } = await supabase
      .from('daily_raw_articles')
      .select(`
        id, title, link, description, pub_date, guid, creator, categories, 
        content, image_url, source_name, source_url,
        ml_relevance_score, student_priority, ai_reasoning, ai_categories,
        fetch_date, ai_scored, daily_rank
      `)
      .eq('source_name', 'The Decoder')
      .gte('fetch_date', weekStart)
      .lte('fetch_date', weekEnd)
      .lte('daily_rank', 10) // Only articles ranked 1-10 daily
      .not('daily_rank', 'is', null)
      .order('ml_relevance_score', { ascending: false });

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!weeklyArticles || weeklyArticles.length === 0) {
      throw new Error(`No articles found for week ${currentWeek}/${currentYear}`);
    }

    console.log(`✅ Found ${weeklyArticles.length} articles from the week's daily top 10s`);

    // Group by day for statistics
    const articlesByDay = weeklyArticles.reduce((groups, article) => {
      const day = article.fetch_date;
      if (!groups[day]) groups[day] = [];
      groups[day].push(article);
      return groups;
    }, {});

    console.log(`📊 Articles per day:`);
    Object.entries(articlesByDay).forEach(([day, articles]) => {
      console.log(`   ${day}: ${articles.length} articles`);
    });

    // Step 2: Re-rank all articles and select final top 10
    console.log(`\n--- Re-ranking ${weeklyArticles.length} articles for final top 10 ---`);
    
    // Sort by ML relevance score (highest first)
    const reRankedArticles = weeklyArticles.sort((a, b) => (b.ml_relevance_score || 0) - (a.ml_relevance_score || 0));
    
    // Select final top 10 for newsletter
    const finalTop10 = reRankedArticles.slice(0, 10);

    console.log(`🏆 FINAL TOP 10 FOR NEWSLETTER:`);
    finalTop10.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title.substring(0, 60)}... (Score: ${article.ml_relevance_score}, Day: ${article.fetch_date})`);
    });

    // Step 3: Generate newsletter content using Gemini AI
    console.log(`\n--- Generating newsletter content ---`);
    
    const newsletterContent = await generateNewsletterContent(
      currentWeek,
      currentYear,
      dateRange,
      finalTop10,
      supabaseUrl,
      supabaseServiceKey
    );

    if (!newsletterContent) {
      throw new Error("Newsletter-Generierung fehlgeschlagen");
    }

    // Step 4: Save newsletter to archive
    const { data: savedNewsletter, error: saveError } = await supabase
      .from('newsletter_archive')
      .insert({
        week_number: currentWeek,
        year: currentYear,
        title: `LINKIT WEEKLY KW ${currentWeek}`,
        content: newsletterContent,
        html_content: convertMarkdownToHTML(newsletterContent),
        date_range: dateRange,
        article_count: finalTop10.length
      })
      .select()
      .single();

    if (saveError) {
      throw new Error(`Fehler beim Speichern: ${saveError.message}`);
    }

    // Generate summary
    const summary = {
      week: currentWeek,
      year: currentYear,
      date_range: dateRange,
      total_articles_reviewed: weeklyArticles.length,
      final_top_10_selected: finalTop10.length,
      days_covered: Object.keys(articlesByDay).length,
      average_score_top_10: finalTop10.reduce((sum, a) => sum + (a.ml_relevance_score || 0), 0) / finalTop10.length,
      ai_scored_in_top_10: finalTop10.filter(a => a.ai_scored).length,
      student_priority_in_top_10: finalTop10.filter(a => a.student_priority).length,
      newsletter_id: savedNewsletter.id
    };

    console.log(`\n✅ NEWSLETTER GENERATED SUCCESSFULLY:`);
    console.log(`- Week: ${summary.week}/${summary.year}`);
    console.log(`- Articles reviewed: ${summary.total_articles_reviewed}`);
    console.log(`- Final top 10 selected`);
    console.log(`- Average score: ${Math.round(summary.average_score_top_10 * 100) / 100}`);
    console.log(`- Newsletter ID: ${summary.newsletter_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Newsletter für KW ${currentWeek}/${currentYear} erfolgreich generiert`,
        summary,
        final_top_10: finalTop10.map((article, index) => ({
          newsletter_rank: index + 1,
          title: article.title,
          score: article.ml_relevance_score,
          student_priority: article.student_priority,
          ai_scored: article.ai_scored,
          fetch_date: article.fetch_date,
          daily_rank: article.daily_rank,
          link: article.link
        }))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Error in weekly-newsletter-processor:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Weekly processing failed", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDateRange(weekNumber: number, year: number) {
  const startDate = getDateOfISOWeek(weekNumber, year);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const formatDate = (date: Date) => date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return {
    weekStart: startDate.toISOString().split('T')[0],
    weekEnd: endDate.toISOString().split('T')[0],
    dateRange: `${formatDate(startDate)}–${formatDate(endDate)}`
  };
}

function getDateOfISOWeek(week: number, year: number): Date {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dayOfWeek = simple.getDay();
  const date = simple;
  if (dayOfWeek <= 4) {
    date.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    date.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return date;
}

async function generateNewsletterContent(
  weekNumber: number, 
  year: number, 
  dateRange: string, 
  articles: any[],
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/gemini-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ 
        action: 'generate-summary',
        data: {
          digest: { weekNumber, year, dateRange, items: articles },
          selectedArticles: articles
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini AI call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content || generateFallbackContent(weekNumber, year, dateRange, articles);
  } catch (error) {
    console.error("Error calling Gemini AI:", error);
    return generateFallbackContent(weekNumber, year, dateRange, articles);
  }
}

function generateFallbackContent(weekNumber: number, year: number, dateRange: string, articles: any[]): string {
  const articleList = articles.map((article, index) => `### ${index + 1}. ${article.title}

${article.description}

**Relevanz für Studierende:** Score ${article.ml_relevance_score}/10 ${article.student_priority ? '🎯 High Priority' : ''}
**Quelle:** The Decoder  
👉 **Zum Artikel** [${article.link}](${article.link})
`).join('\n\n');

  return `# 📬 LINKIT WEEKLY KW ${weekNumber}

**Dein Update zu KI, Data Science und Industrie 4.0**

KW ${weekNumber} · ${dateRange}

Hey zusammen!

Diese Woche haben wir wieder die besten KI-News von The Decoder für euch kuratiert. Aus über 70 Artikeln der Woche haben wir die Top 10 ausgewählt, die für euer Studium und eure Karriere am relevantesten sind.

${articleList}

## Das war diese Woche wichtig

Die Top 10 Artikel zeigen wieder, wie schnell sich der KI-Bereich entwickelt. Bleibt dran, experimentiert mit den neuen Tools und vernetzt euch mit der Community!

Bis nächste Woche! 🚀

---

**LINKIT - Data Science & Machine Learning** | Hochschulgruppe für KI-Enthusiasten
`;
}

function convertMarkdownToHTML(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n/gim, '<br>');
} 