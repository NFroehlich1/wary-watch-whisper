import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { RssItem } from "../types/newsTypes";

// Database article type matching the actual Supabase table structure
interface DatabaseArticle {
  id: string;
  title: string | null;
  link: string | null;
  guid: string | null;
  pubdate: string | null; // Note: lowercase 'pubdate' to match database
  description: string | null;
  content: string | null;
  categories: string[] | null;
  creator: string | null;
  image_url: string | null;
  source_name: string | null;
  source_url: string | null;
  fetched_at: string | null;
  processed: boolean | null;
  created_at: string;
  updated_at: string;
}

class RawArticleService {
  
  // Save articles to database
  public async saveArticles(articles: RssItem[]): Promise<void> {
    console.log(`=== SAVING ${articles.length} ARTICLES TO DATABASE ===`);
    
    if (articles.length === 0) {
      console.log("No articles to save");
      return;
    }

    try {
      // Convert RssItem to database format
      const dbArticles = articles.map(article => ({
        title: article.title || null,
        link: article.link || null,
        guid: article.guid || article.link || null,
        pubdate: article.pubDate || new Date().toISOString(), // Use lowercase 'pubdate'
        description: article.description || null,
        content: article.content || null,
        categories: article.categories || null,
        creator: article.creator || null,
        image_url: article.imageUrl || null,
        source_name: article.sourceName || null,
        source_url: article.link || null,
        processed: false
      }));

      // Check for duplicates before saving
      let duplicateCount = 0;
      for (const article of dbArticles) {
        if (article.guid) {
          const exists = await this.articleExists(article.guid);
          if (exists) {
            duplicateCount++;
          }
        }
      }

      if (duplicateCount > 0) {
        console.log(`⚠️ Found ${duplicateCount} duplicate articles that will be skipped`);
      }

      // Use upsert to avoid duplicates based on guid
      const { data, error } = await supabase
        .from('daily_raw_articles')
        .upsert(dbArticles, { 
          onConflict: 'guid',
          ignoreDuplicates: true 
        })
        .select();

      if (error) {
        console.error("Database error:", error);
        throw new Error(`Fehler beim Speichern der Artikel: ${error.message}`);
      }

      const savedCount = data?.length || 0;
      const skippedCount = articles.length - savedCount;
      
      console.log(`✅ Successfully saved ${savedCount} new articles${skippedCount > 0 ? `, skipped ${skippedCount} duplicates` : ''}`);
      
      if (skippedCount > 0) {
        toast.info(`${savedCount} neue Artikel gespeichert, ${skippedCount} Duplikate übersprungen`);
      }
      
    } catch (error) {
      console.error("Error in saveArticles:", error);
      throw error;
    }
  }

  // Get articles for current week
  public async getCurrentWeekArticles(): Promise<DatabaseArticle[]> {
    try {
      const startOfWeek = this.getStartOfCurrentWeek();
      
      const { data, error } = await supabase
        .from('daily_raw_articles')
        .select('*')
        .gte('pubdate', startOfWeek.toISOString()) // Use lowercase 'pubdate'
        .order('pubdate', { ascending: false });

      if (error) {
        console.error("Error fetching current week articles:", error);
        throw new Error(`Fehler beim Laden der Artikel: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in getCurrentWeekArticles:", error);
      throw error;
    }
  }

  // Get all articles from database
  public async getAllArticles(limit: number = 1000): Promise<DatabaseArticle[]> {
    try {
      console.log(`📋 Fetching up to ${limit} articles from database...`);
      
      const { data, error } = await supabase
        .from('daily_raw_articles')
        .select('*')
        .order('pubdate', { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching all articles:", error);
        throw new Error(`Fehler beim Laden aller Artikel: ${error.message}`);
      }

      console.log(`✅ Fetched ${data?.length || 0} articles from database`);
      return data || [];
    } catch (error) {
      console.error("Error in getAllArticles:", error);
      throw error;
    }
  }

  // Convert database article to RssItem
  public convertToRssItem(dbArticle: DatabaseArticle): RssItem {
    return {
      title: dbArticle.title || "Untitled",
      link: dbArticle.link || "",
      guid: dbArticle.guid || dbArticle.link || "",
      pubDate: dbArticle.pubdate || new Date().toISOString(), // Convert back to pubDate
      description: dbArticle.description || null,
      content: dbArticle.content || null,
      categories: dbArticle.categories || [],
      creator: dbArticle.creator || null,
      imageUrl: dbArticle.image_url || null,
      sourceName: dbArticle.source_name || "Unknown Source"
    };
  }

  // Mark articles as processed
  public async markArticlesAsProcessed(articleIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('daily_raw_articles')
        .update({ processed: true })
        .in('id', articleIds);

      if (error) {
        console.error("Error marking articles as processed:", error);
        throw new Error(`Fehler beim Markieren der Artikel: ${error.message}`);
      }

      console.log(`✅ Marked ${articleIds.length} articles as processed`);
    } catch (error) {
      console.error("Error in markArticlesAsProcessed:", error);
      throw error;
    }
  }

  // Get article statistics
  public async getArticleStats() {
    try {
      const startOfWeek = this.getStartOfCurrentWeek();
      
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('daily_raw_articles')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get this week count
      const { count: thisWeek, error: weekError } = await supabase
        .from('daily_raw_articles')
        .select('*', { count: 'exact', head: true })
        .gte('pubdate', startOfWeek.toISOString()); // Use lowercase 'pubdate'

      if (weekError) throw weekError;

      // Get processed count
      const { count: processed, error: processedError } = await supabase
        .from('daily_raw_articles')
        .select('*', { count: 'exact', head: true })
        .eq('processed', true);

      if (processedError) throw processedError;

      return {
        total: total || 0,
        thisWeek: thisWeek || 0,
        processed: processed || 0,
        unprocessed: (total || 0) - (processed || 0)
      };
    } catch (error) {
      console.error("Error getting article stats:", error);
      return { total: 0, thisWeek: 0, processed: 0, unprocessed: 0 };
    }
  }

  // Check if an article with the given URL/GUID already exists
  public async articleExists(url: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if article exists with URL/GUID: ${url}`);
      
      const { data, error } = await supabase
        .from('daily_raw_articles')
        .select('id, title, link')
        .or(`guid.eq.${url},link.eq.${url}`)
        .limit(1);

      if (error) {
        console.error("Error checking for duplicate article:", error);
        return false; // In case of error, allow the operation
      }

      const exists = data && data.length > 0;
      
      if (exists) {
        console.log(`⚠️ Duplicate found: "${data[0].title}" (${data[0].link})`);
      } else {
        console.log(`✅ No duplicate found for: ${url}`);
      }
      
      return exists;
    } catch (error) {
      console.error("Error in articleExists:", error);
      return false; // In case of error, allow the operation
    }
  }

  // Helper method to get start of current week (Monday)
  private getStartOfCurrentWeek(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust for Sunday (0)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }
}

export default RawArticleService;
