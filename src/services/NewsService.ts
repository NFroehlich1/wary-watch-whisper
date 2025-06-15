import { toast } from "sonner";
import DecoderService from "./DecoderService";
import RssSourceService from "./RssSourceService";
import RssFeedService from "./RssFeedService";
import DigestService from "./DigestService";
import NewsletterArchiveService from "./NewsletterArchiveService";
import RawArticleService from "./RawArticleService";
import type { RssItem, RssSource, WeeklyDigest } from "../types/newsTypes";
import { MOCK_NEWS_ITEMS } from "../data/mockNews";
import { formatDate, getCurrentWeek, getCurrentYear, getWeekDateRange } from "../utils/dateUtils";
import { LocalNewsletter } from "../types/newsletterTypes";
import LocalNewsletterService from "./LocalNewsletterService";
import { supabase } from "@/integrations/supabase/client";

// Re-export types
export type { RssItem, RssSource, WeeklyDigest };
export { formatDate, getCurrentWeek, getCurrentYear, getWeekDateRange };

// Main service class for fetching news from RSS feeds
class NewsService {
  private decoderService: DecoderService;
  private rssSourceService: RssSourceService;
  private rssFeedService: RssFeedService;
  private digestService: DigestService;
  private localNewsletterService: LocalNewsletterService;
  private newsletterArchiveService: NewsletterArchiveService;
  private rawArticleService: RawArticleService;
  private useMockData: boolean = false;
  private preferredAIModel: 'gemini' | 'mistral' = 'gemini';
  
  constructor() {
    console.log("=== NEWS SERVICE CONSTRUCTOR ===");
    console.log("Using Supabase Edge Functions for AI (Gemini & Mistral)");
    
    this.rssSourceService = new RssSourceService();
    
    this.rssFeedService = new RssFeedService();
    this.digestService = new DigestService();
    this.localNewsletterService = new LocalNewsletterService();
    this.newsletterArchiveService = new NewsletterArchiveService();
    this.rawArticleService = new RawArticleService();
    
    // Create DecoderService without API key (uses Supabase)
    this.decoderService = new DecoderService();
    
    console.log("DecoderService created using Supabase Edge Function");
  }
  
  // Set the API key (now ignored, kept for compatibility)
  public setApiKey(apiKey: string): void {
    console.log("=== API KEY SETTING IGNORED ===");
    console.log("Using Supabase Edge Function instead of direct API key");
  }

  // Set preferred AI model for operations
  public setPreferredAIModel(model: 'gemini' | 'mistral'): void {
    console.log(`=== SETTING PREFERRED AI MODEL TO: ${model.toUpperCase()} ===`);
    this.preferredAIModel = model;
  }

  // Get preferred AI model
  public getPreferredAIModel(): 'gemini' | 'mistral' {
    return this.preferredAIModel;
  }
  
  // Get the default API key (returns RSS2JSON key for RSS feeds)
  public getDefaultApiKey(): string {
    return this.decoderService.getRss2JsonApiKey();
  }
  
  // Get the Gemini API key (now returns info message)
  public getGeminiApiKey(): string {
    return "Stored securely in Supabase";
  }
  
  // Enable or disable mock data
  public setUseMockData(useMock: boolean): void {
    this.useMockData = useMock;
  }
  
  // RSS Source methods (delegated to RssSourceService)
  public getRssSources(): RssSource[] {
    return this.rssSourceService.getRssSources();
  }
  
  public getEnabledRssSources(): RssSource[] {
    return this.rssSourceService.getEnabledRssSources();
  }
  
  public addRssSource(url: string, name: string): boolean {
    return this.rssSourceService.addRssSource(url, name);
  }
  
  public removeRssSource(url: string): boolean {
    return this.rssSourceService.removeRssSource(url);
  }
  
  public toggleRssSource(url: string, enabled: boolean): boolean {
    return this.rssSourceService.toggleRssSource(url, enabled);
  }

  public resetRssSourcesToDefaults(): void {
    this.rssSourceService.resetToDefaults();
  }
  
  // Enhanced fetch news with guaranteed high article count and database storage
  public async fetchNews(): Promise<RssItem[]> {
    if (this.useMockData) {
      console.log("Using mock data instead of fetching from API");
      const mockData = MOCK_NEWS_ITEMS;
      return Promise.resolve(this.filterArticlesByEnabledSources(mockData));
    }
    
    const enabledSources = this.getEnabledRssSources();
    
    if (enabledSources.length === 0) {
      console.log("No enabled RSS sources found, using mock data");
      toast.warning("Keine RSS-Quellen aktiviert");
      const mockData = MOCK_NEWS_ITEMS;
      return Promise.resolve(this.filterArticlesByEnabledSources(mockData));
    }
    
    try {
      console.log(`=== NEWS FETCH START ===`);
      console.log(`Enabled sources: ${enabledSources.length}`);
      
      // Use the enhanced RssFeedService to fetch all sources
      const allItems = await this.rssFeedService.fetchAllSources(enabledSources, true);
      
      if (allItems.length === 0) {
        console.warn("No items found in any RSS feed, using fallback data");
        toast.warning("Keine Artikel in den RSS-Feeds gefunden - verwende Beispieldaten");
        const mockData = MOCK_NEWS_ITEMS;
        return this.filterArticlesByEnabledSources(mockData);
      }
      
      // Filter articles by enabled sources
      const filteredItems = this.filterArticlesByEnabledSources(allItems);
      
      // Save articles to database
      try {
        await this.rawArticleService.saveArticles(filteredItems);
        console.log(`✅ ${filteredItems.length} filtered articles saved to database`);
      } catch (saveError) {
        console.error("Error saving articles to database:", saveError);
        toast.warning("Artikel geladen, aber nicht in Datenbank gespeichert");
      }
      
      console.log(`=== FETCH RESULTS ===`);
      console.log(`Total articles fetched: ${allItems.length}`);
      console.log(`Filtered articles: ${filteredItems.length}`);
      
      // Sort by date (newest first)
      filteredItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      console.log(`=== RETURNING ${filteredItems.length} PERSONALIZED ARTICLES ===`);
      return filteredItems;
      
    } catch (error) {
      console.error('Critical error fetching news:', error);
      toast.error(`Fehler beim Laden der Nachrichten: ${(error as Error).message}`);
      
      console.log("Using fallback mock data due to error");
      const mockData = MOCK_NEWS_ITEMS;
      return this.filterArticlesByEnabledSources(mockData);
    }
  }

  // Get articles from database for current week
  public async getStoredArticlesForCurrentWeek(): Promise<RssItem[]> {
    try {
      console.log("=== FETCHING STORED ARTICLES FOR CURRENT WEEK ===");
      const rawArticles = await this.rawArticleService.getCurrentWeekArticles();
      const rssItems = rawArticles.map(article => this.rawArticleService.convertToRssItem(article));
      
      // Filter by enabled sources
      const filteredItems = this.filterArticlesByEnabledSources(rssItems);
      
      console.log(`✅ Found ${rssItems.length} stored articles, ${filteredItems.length} from enabled sources`);
      return filteredItems;
    } catch (error) {
      console.error("Error fetching stored articles:", error);
      toast.error("Fehler beim Laden der gespeicherten Artikel");
      return [];
    }
  }

  // Get all articles from database
  public async getAllStoredArticles(limit?: number): Promise<RssItem[]> {
    try {
      console.log("=== FETCHING ALL STORED ARTICLES ===");
      const rawArticles = await this.rawArticleService.getAllArticles(limit);
      const rssItems = rawArticles.map(article => this.rawArticleService.convertToRssItem(article));
      
      // Filter by enabled sources
      const filteredItems = this.filterArticlesByEnabledSources(rssItems);
      
      console.log(`✅ Found ${rssItems.length} stored articles, ${filteredItems.length} from enabled sources`);
      return filteredItems;
    } catch (error) {
      console.error("Error fetching all stored articles:", error);
      toast.error("Fehler beim Laden aller gespeicherten Artikel");
      return [];
    }
  }

  // Get article statistics
  public async getArticleStats() {
    try {
      return await this.rawArticleService.getArticleStats();
    } catch (error) {
      console.error("Error getting article stats:", error);
      return { total: 0, thisWeek: 0, processed: 0, unprocessed: 0 };
    }
  }
  
  // Check if an article with the given URL already exists
  public async checkArticleExists(url: string): Promise<boolean> {
    try {
      return await this.rawArticleService.articleExists(url);
    } catch (error) {
      console.error("Error checking if article exists:", error);
      return false;
    }
  }
  
  // Save a single custom article to the database
  public async saveCustomArticle(article: RssItem): Promise<void> {
    try {
      console.log("💾 NewsService: Saving custom article to database:", article.title);
      await this.rawArticleService.saveArticles([article]);
      console.log("✅ NewsService: Custom article saved successfully");
    } catch (error) {
      console.error("❌ NewsService: Error saving custom article:", error);
      throw error;
    }
  }
  
  // Generate AI summary for a specific article
  public async generateArticleSummary(article: RssItem): Promise<string | null> {
    try {
      return await this.decoderService.generateArticleSummary(article);
    } catch (error) {
      console.error('Error generating article summary:', error);
      toast.error(`Fehler bei der Zusammenfassung des Artikels: ${(error as Error).message}`);
      return null;
    }
  }
  
  // Fetch metadata for a URL
  public async fetchArticleMetadata(url: string): Promise<Partial<RssItem>> {
    try {
      toast.info("Artikelmetadaten werden abgerufen...");
      
      // Use decoder service to extract metadata from URL
      const metadata = await this.decoderService.extractArticleMetadata(url);
      
      if (!metadata || (!metadata.title && !metadata.description)) {
        toast.warning("Konnte keine Metadaten abrufen, verwende Standardwerte");
        return {
          title: "Artikel ohne Titel",
          description: "Keine Beschreibung verfügbar"
        };
      }
      
      return metadata;
    } catch (error) {
      console.error("Error fetching article metadata:", error);
      toast.error("Fehler beim Abrufen der Metadaten");
      
      return {
        title: "Artikel ohne Titel",
        description: "Keine Beschreibung verfügbar"
      };
    }
  }
  
  // Automatically clean up old articles (more than a week old)
  public cleanupOldArticles(digests: Record<string, WeeklyDigest>): Record<string, WeeklyDigest> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const cleanedDigests = { ...digests };
    
    // For each digest, filter out old articles
    Object.keys(cleanedDigests).forEach(key => {
      const digest = cleanedDigests[key];
      
      // Filter items to keep only those newer than one week
      digest.items = digest.items.filter(item => {
        const pubDate = new Date(item.pubDate);
        return pubDate >= oneWeekAgo;
      });
    });
    
    // Remove empty digests
    Object.keys(cleanedDigests).forEach(key => {
      if (cleanedDigests[key].items.length === 0) {
        delete cleanedDigests[key];
      }
    });
    
    return cleanedDigests;
  }
  
  // Digest methods (delegated to DigestService)
  public filterCurrentWeekNews(items: RssItem[]): RssItem[] {
    return this.digestService.filterCurrentWeekNews(items);
  }
  
  public groupNewsByWeek(items: RssItem[]): Record<string, WeeklyDigest> {
    return this.digestService.groupNewsByWeek(items);
  }
  
  // Save newsletter to localStorage using LocalNewsletterService
  public async saveNewsletterToLocal(newsletter: LocalNewsletter): Promise<void> {
    return this.localNewsletterService.saveNewsletter(newsletter);
  }
  
  // Get newsletters from localStorage using LocalNewsletterService
  public async getLocalNewsletters(): Promise<LocalNewsletter[]> {
    return this.localNewsletterService.getNewsletters();
  }
  
  // Clear newsletters from localStorage using LocalNewsletterService
  public async clearLocalNewsletters(): Promise<void> {
    return this.localNewsletterService.clearNewsletters();
  }
  
  // Generate demo data for newsletters using LocalNewsletterService
  public async generateDemoNewsletters(): Promise<void> {
    return this.localNewsletterService.generateDemoData();
  }

  // Enhanced newsletter generation method - uses Supabase Edge Function
  public async generateNewsletterSummary(digest: WeeklyDigest, selectedArticles?: RssItem[], linkedInPage?: string): Promise<string> {
    console.log("=== NEWS SERVICE: GENERATE NEWSLETTER SUMMARY VIA SUPABASE ===");
    
    try {
      // Use selected articles or all available articles
      const articlesToUse = selectedArticles || digest.items;
      
      console.log("Generating enhanced newsletter summary via Supabase...");
      const summary = await this.decoderService.generateSummary(digest, articlesToUse, linkedInPage);
      
      // Mark articles as processed if they were successfully used for newsletter generation
      if (summary && articlesToUse.length > 0) {
        try {
          const articleGuids = articlesToUse.map(article => article.guid).filter(Boolean);
          if (articleGuids.length > 0) {
            // Get article IDs from database by their GUIDs
            const { data: rawArticles } = await supabase
              .from('daily_raw_articles')
              .select('id')
              .in('guid', articleGuids);
            
            if (rawArticles && rawArticles.length > 0) {
              const articleIds = rawArticles.map(article => article.id);
              await this.rawArticleService.markArticlesAsProcessed(articleIds);
              console.log(`✅ Marked ${articleIds.length} articles as processed`);
            }
          }
        } catch (markError) {
          console.error("Error marking articles as processed:", markError);
          // Don't throw error, just log it
        }
      }
      
      // Return the enhanced summary
      return summary;
    } catch (error) {
      console.error('Error generating enhanced newsletter via Supabase:', error);
      toast.error(`Fehler bei der Generierung des ausführlichen Newsletters: ${(error as Error).message}`);
      return "";
    }
  }

  // New method: Trigger automatic newsletter generation
  public async triggerAutomaticGeneration(): Promise<{ success: boolean; message: string; data?: any }> {
    console.log("=== TRIGGERING AUTOMATIC NEWSLETTER GENERATION ===");
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-generate-newsletter', {
        body: { trigger: 'manual' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast.success(data.message);
        return { success: true, message: data.message, data };
      } else {
        toast.error(data.error || "Unbekannter Fehler");
        return { success: false, message: data.error || "Unbekannter Fehler" };
      }
    } catch (error) {
      console.error('Error triggering automatic generation:', error);
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error(`Fehler bei der automatischen Generierung: ${errorMessage}`);
      return { success: false, message: errorMessage };
    }
  }

  // Newsletter archive methods
  public async saveNewsletterToArchive(digest: WeeklyDigest, content: string, htmlContent?: string) {
    return this.newsletterArchiveService.saveNewsletter(digest, content, htmlContent);
  }

  public async getNewsletterArchive() {
    return this.newsletterArchiveService.getNewsletters();
  }

  public async getNewsletterByWeek(weekNumber: number, year: number) {
    return this.newsletterArchiveService.getNewsletterByWeek(weekNumber, year);
  }

  public async deleteArchivedNewsletter(id: string) {
    return this.newsletterArchiveService.deleteNewsletter(id);
  }

  // Raw article service methods
  public getRawArticleService(): RawArticleService {
    return this.rawArticleService;
  }

  public getDecoderService(): DecoderService {
    return this.decoderService;
  }

  // ENHANCED: Filter articles by enabled RSS sources AND AI/Data Science relevance
  public filterArticlesByEnabledSources(articles: RssItem[]): RssItem[] {
    console.log("🔍 STARTING INTELLIGENT AI FILTERING");
    console.log(`Input: ${articles.length} articles`);
    
    const enabledSources = this.getEnabledRssSources();
    const enabledSourceNames = enabledSources.map(source => source.name.toLowerCase());
    const enabledSourceUrls = enabledSources.map(source => {
      try {
        return new URL(source.url).hostname.toLowerCase();
      } catch {
        return source.url.toLowerCase();
      }
    });
    
    // Step 1: Filter by enabled sources
    const sourceFilteredArticles = articles.filter(article => {
      // Check by source name (exact match)
      if (article.sourceName && enabledSourceNames.includes(article.sourceName.toLowerCase())) {
        return true;
      }
      
      // Check by URL hostname
      if (article.link) {
        try {
          const articleHostname = new URL(article.link).hostname.toLowerCase();
          if (enabledSourceUrls.some(sourceUrl => 
            articleHostname.includes(sourceUrl) || sourceUrl.includes(articleHostname)
          )) {
            return true;
          }
        } catch {
          // If URL parsing fails, continue with other checks
        }
      }
      
      // Check by partial source name matching
      if (article.sourceName) {
        const articleSourceLower = article.sourceName.toLowerCase();
        return enabledSourceNames.some(enabledName => 
          articleSourceLower.includes(enabledName) || 
          enabledName.includes(articleSourceLower) ||
          this.isSourceNameMatch(articleSourceLower, enabledName)
        );
      }
      
      return false;
    });
    
    console.log(`After source filtering: ${sourceFilteredArticles.length} articles`);
    
    // Step 2: Apply STRICT AI/Data Science content filtering
    const aiRelevantArticles = sourceFilteredArticles.filter(article => {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const content = `${title} ${description}`;
      
      console.log(`🔍 Checking: "${article.title}"`);
      
      // STRICT AI Keywords - must have at least one
      const aiKeywords = [
        'ki ', ' ai ', 'artificial intelligence', 'künstliche intelligenz',
        'machine learning', 'deep learning', 'neural network',
        'chatgpt', 'openai', 'claude', 'gemini', 'bard',
        'llm', 'large language model', 'transformer',
        'data science', 'datenwissenschaft', 'algorithmus', 'algorithm',
        'computer vision', 'nlp', 'natural language processing',
        'robotik', 'robotics', 'automation', 'autonom',
        'tensorflow', 'pytorch', 'hugging face'
      ];
      
      // Check for AI keywords
      const hasAiKeyword = aiKeywords.some(keyword => content.includes(keyword));
      
      if (hasAiKeyword) {
        console.log(`✅ ACCEPTED: Found AI keyword in "${article.title}"`);
        return true;
      }
      
      // EXCLUDE non-AI topics
      const excludeKeywords = [
        'audio overviews', 'search queries', 'founder experience',
        'startup funding', 'business strategy', 'venture capital',
        'sport', 'entertainment', 'musik', 'film', 'celebrity',
        'mode', 'fashion', 'lifestyle', 'kochen', 'travel',
        'politik', 'politics', 'wetter', 'weather'
      ];
      
      const hasExcludeKeyword = excludeKeywords.some(keyword => content.includes(keyword));
      
      if (hasExcludeKeyword) {
        console.log(`❌ REJECTED: Contains exclude keyword in "${article.title}"`);
        return false;
      }
      
      console.log(`❌ REJECTED: No AI relevance in "${article.title}"`);
      return false;
    });
    
    console.log(`🎯 FINAL RESULT: ${aiRelevantArticles.length} AI-relevant articles`);
    console.log(`Filtered out: ${sourceFilteredArticles.length - aiRelevantArticles.length} non-AI articles`);
    
    return aiRelevantArticles;
  }

  // Basic source filtering without AI content filtering
  public filterArticlesByEnabledSourcesOnly(articles: RssItem[]): RssItem[] {
    console.log("🔍 BASIC SOURCE FILTERING (NO AI FILTER)");
    
    const enabledSources = this.getEnabledRssSources();
    const enabledSourceNames = enabledSources.map(source => source.name.toLowerCase());
    const enabledSourceUrls = enabledSources.map(source => {
      try {
        return new URL(source.url).hostname.toLowerCase();
      } catch {
        return source.url.toLowerCase();
      }
    });
    
    const filteredArticles = articles.filter(article => {
      // Check by source name (exact match)
      if (article.sourceName && enabledSourceNames.includes(article.sourceName.toLowerCase())) {
        return true;
      }
      
      // Check by URL hostname
      if (article.link) {
        try {
          const articleHostname = new URL(article.link).hostname.toLowerCase();
          if (enabledSourceUrls.some(sourceUrl => 
            articleHostname.includes(sourceUrl) || sourceUrl.includes(articleHostname)
          )) {
            return true;
          }
        } catch {
          // If URL parsing fails, continue with other checks
        }
      }
      
      // Check by partial source name matching
      if (article.sourceName) {
        const articleSourceLower = article.sourceName.toLowerCase();
        return enabledSourceNames.some(enabledName => 
          articleSourceLower.includes(enabledName) || 
          enabledName.includes(articleSourceLower) ||
          this.isSourceNameMatch(articleSourceLower, enabledName)
        );
      }
      
      return false;
    });
    
    console.log(`Basic filtering result: ${filteredArticles.length} articles`);
    return filteredArticles;
  }

  // Helper method for flexible source name matching
  private isSourceNameMatch(articleSource: string, enabledSource: string): boolean {
    // Remove common words and check for core matches
    const cleanArticleSource = articleSource.replace(/\b(news|magazine|online|de|com|tech|technology)\b/g, '').trim();
    const cleanEnabledSource = enabledSource.replace(/\b(news|magazine|online|de|com|tech|technology)\b/g, '').trim();
    
    // Check for core name matches
    if (cleanArticleSource.includes('decoder') && cleanEnabledSource.includes('decoder')) return true;
    if (cleanArticleSource.includes('golem') && cleanEnabledSource.includes('golem')) return true;
    if (cleanArticleSource.includes('heise') && cleanEnabledSource.includes('heise')) return true;
    if (cleanArticleSource.includes('techcrunch') && cleanEnabledSource.includes('techcrunch')) return true;
    if (cleanArticleSource.includes('t3n') && cleanEnabledSource.includes('t3n')) return true;
    if (cleanArticleSource.includes('mit') && cleanEnabledSource.includes('mit')) return true;
    if (cleanArticleSource.includes('wired') && cleanEnabledSource.includes('wired')) return true;
    
    return false;
  }
}

export default NewsService;
