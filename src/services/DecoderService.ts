import { RssItem, WeeklyDigest } from "@/types/newsTypes";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type LLMProvider = 'gemini' | 'mistral' | 'auto';

class DecoderService {
  private rss2JsonApiKey: string = "4aslwlcwucxcdgqjglhcv7jgpwoxq4yso";
  private preferredProvider: LLMProvider;

  constructor(preferredProvider: LLMProvider = 'auto') {
    console.log(`DecoderService created - using Supabase Edge Functions for AI (preferred: ${preferredProvider})`);
    this.preferredProvider = preferredProvider;
  }

  // Set the preferred LLM provider
  public setPreferredProvider(provider: LLMProvider): void {
    this.preferredProvider = provider;
    console.log(`Preferred LLM provider set to: ${provider}`);
  }

  // Get current preferred provider
  public getPreferredProvider(): LLMProvider {
    return this.preferredProvider;
  }

  // Updated API key info method to include both providers
  public getApiKeyInfo(): string {
    return "LLM API keys stored securely in Supabase (Gemini & Mistral)";
  }

  // Verify API key for a specific provider or both
  public async verifyApiKey(provider?: LLMProvider): Promise<{ isValid: boolean; message: string; provider?: string }> {
    console.log(`=== VERIFYING LLM API KEY(S) VIA SUPABASE ===`);

    const targetProvider = provider || this.preferredProvider;

    if (targetProvider === 'auto') {
      // Test both providers
      const geminiResult = await this.testProvider('gemini');
      const mistralResult = await this.testProvider('mistral');

      if (geminiResult.isValid && mistralResult.isValid) {
        return { isValid: true, message: "Beide LLM-Provider (Gemini & Mistral) sind verfügbar", provider: "both" };
      } else if (geminiResult.isValid) {
        return { isValid: true, message: "Nur Gemini ist verfügbar", provider: "gemini" };
      } else if (mistralResult.isValid) {
        return { isValid: true, message: "Nur Mistral ist verfügbar", provider: "mistral" };
      } else {
        return { isValid: false, message: "Beide LLM-Provider sind nicht verfügbar" };
      }
    } else {
      // Test specific provider
      return await this.testProvider(targetProvider);
    }
  }

  private async testProvider(provider: 'gemini' | 'mistral'): Promise<{ isValid: boolean; message: string; provider: string }> {
    try {
      const functionName = provider === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { action: 'verify-key' }
      });

      if (error) {
        console.error(`❌ ${provider} function error:`, error);
        return { isValid: false, message: `${provider} Fehler: ${error.message}`, provider };
      }

      console.log(`✅ ${provider} API key verification successful`);
      return { isValid: data.isValid, message: data.message, provider };

    } catch (error) {
      console.error(`❌ ${provider} API verification error:`, error);
      return { isValid: false, message: `${provider} Verbindungsfehler: ${(error as Error).message}`, provider };
    }
  }

  // Enhanced generateDetailedSummary with provider selection and fallback
  public async generateDetailedSummary(
    digest: WeeklyDigest, 
    selectedArticles?: RssItem[], 
    linkedInPage?: string,
    forceProvider?: LLMProvider
  ): Promise<string> {
    console.log("=== DECODER SERVICE GENERATE SUMMARY WITH LLM PROVIDERS ===");

    if (!digest || (!digest.items?.length && !selectedArticles?.length)) {
      throw new Error("Keine Artikel für die Newsletter-Generierung verfügbar");
    }

    const articlesToUse = selectedArticles || digest.items;
    console.log(`Generating detailed summary for ${articlesToUse.length} articles`);

    const targetProvider = forceProvider || this.preferredProvider;
    
    // Try with preferred/specified provider first
    if (targetProvider === 'auto') {
      // Try Gemini first, then Mistral
      const result = await this.tryGenerateSummary('gemini', digest, selectedArticles, linkedInPage);
      if (result.success) {
        return result.content;
      }
      
      console.log("Gemini failed, trying Mistral...");
      const mistralResult = await this.tryGenerateSummary('mistral', digest, selectedArticles, linkedInPage);
      if (mistralResult.success) {
        return mistralResult.content;
      }
      
      throw new Error("Beide LLM-Provider haben fehlgeschlagen");
    } else {
      // Try specific provider, with fallback if it fails
      const result = await this.tryGenerateSummary(targetProvider, digest, selectedArticles, linkedInPage);
      if (result.success) {
        return result.content;
      }
      
      // Try fallback provider
      const fallbackProvider = targetProvider === 'gemini' ? 'mistral' : 'gemini';
      console.log(`${targetProvider} failed, trying fallback ${fallbackProvider}...`);
      
      const fallbackResult = await this.tryGenerateSummary(fallbackProvider, digest, selectedArticles, linkedInPage);
      if (fallbackResult.success) {
        toast.info(`Fallback zu ${fallbackProvider} verwendet`);
        return fallbackResult.content;
      }
      
      throw new Error(`Beide Provider (${targetProvider} und ${fallbackProvider}) haben fehlgeschlagen`);
    }
  }

  private async tryGenerateSummary(
    provider: 'gemini' | 'mistral',
    digest: WeeklyDigest,
    selectedArticles?: RssItem[],
    linkedInPage?: string
  ): Promise<{ success: boolean; content: string; error?: string }> {
    try {
      const functionName = provider === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'generate-summary',
          data: {
            digest,
            selectedArticles,
            linkedInPage
          }
        }
      });

      if (error) {
        console.error(`❌ ${provider} function error:`, error);
        return { success: false, content: "", error: error.message };
      }

      if (!data.content) {
        console.error(`❌ ${provider} returned empty content`);
        return { success: false, content: "", error: "Empty content returned" };
      }

      console.log(`✅ Detailed newsletter generated successfully via ${provider}, length:`, data.content.length);
      return { success: true, content: data.content };

    } catch (error) {
      console.error(`Error generating detailed newsletter via ${provider}:`, error);
      return { success: false, content: "", error: (error as Error).message };
    }
  }

  // Enhanced generateArticleSummary with provider support
  public async generateArticleSummary(
    title: string, 
    content: string,
    forceProvider?: LLMProvider
  ): Promise<string> {
    console.log("=== GENERATING ARTICLE SUMMARY WITH LLM PROVIDERS ===");

    const targetProvider = forceProvider || this.preferredProvider;
    
    if (targetProvider === 'auto') {
      // Try Gemini first, then Mistral
      const result = await this.tryGenerateArticleSummary('gemini', title, content);
      if (result.success) {
        return result.content;
      }
      
      const mistralResult = await this.tryGenerateArticleSummary('mistral', title, content);
      if (mistralResult.success) {
        return mistralResult.content;
      }
      
      throw new Error("Beide LLM-Provider haben fehlgeschlagen");
    } else {
      // Try specific provider with fallback
      const result = await this.tryGenerateArticleSummary(targetProvider, title, content);
      if (result.success) {
        return result.content;
      }
      
      // Try fallback
      const fallbackProvider = targetProvider === 'gemini' ? 'mistral' : 'gemini';
      const fallbackResult = await this.tryGenerateArticleSummary(fallbackProvider, title, content);
      if (fallbackResult.success) {
        return fallbackResult.content;
      }
      
      throw new Error(`Beide Provider haben fehlgeschlagen`);
    }
  }

  private async tryGenerateArticleSummary(
    provider: 'gemini' | 'mistral',
    title: string,
    content: string
  ): Promise<{ success: boolean; content: string; error?: string }> {
    try {
      const functionName = provider === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      
      // Create article object to match expected format
      const article = {
        title,
        content: content || '',
        description: content || '',
        sourceName: 'Unknown',
        link: ''
      };
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'generate-article-summary',
          data: { article }
        }
      });

      if (error) {
        console.error(`❌ ${provider} function error:`, error);
        return { success: false, content: "", error: error.message };
      }

      console.log(`✅ Article summary generated via ${provider}:`, data.summary?.substring(0, 100));
      return { success: true, content: data.summary };

    } catch (error) {
      console.error(`Error generating article summary via ${provider}:`, error);
      return { success: false, content: "", error: (error as Error).message };
    }
  }

  // Enhanced improveArticleTitle with provider support
  public async improveArticleTitle(
    title: string, 
    content?: string,
    forceProvider?: LLMProvider
  ): Promise<string> {
    console.log("=== IMPROVING ARTICLE TITLE WITH LLM PROVIDERS ===");

    const targetProvider = forceProvider || this.preferredProvider;
    
    if (targetProvider === 'auto') {
      // Try Gemini first, then Mistral
      const result = await this.tryImproveTitle('gemini', title, content);
      if (result.success) {
        return result.content;
      }
      
      const mistralResult = await this.tryImproveTitle('mistral', title, content);
      if (mistralResult.success) {
        return mistralResult.content;
      }
      
      throw new Error("Beide LLM-Provider haben fehlgeschlagen");
    } else {
      // Try specific provider with fallback
      const result = await this.tryImproveTitle(targetProvider, title, content);
      if (result.success) {
        return result.content;
      }
      
      // Try fallback
      const fallbackProvider = targetProvider === 'gemini' ? 'mistral' : 'gemini';
      const fallbackResult = await this.tryImproveTitle(fallbackProvider, title, content);
      if (fallbackResult.success) {
        return fallbackResult.content;
      }
      
      throw new Error(`Beide Provider haben fehlgeschlagen`);
    }
  }

  private async tryImproveTitle(
    provider: 'gemini' | 'mistral',
    title: string,
    content?: string
  ): Promise<{ success: boolean; content: string; error?: string }> {
    try {
      const functionName = provider === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      
      // Create article object to match expected format
      const article = {
        title,
        content: content || '',
        description: content || '',
        sourceName: 'Unknown',
        link: ''
      };
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'improve-article-title',
          data: { article }
        }
      });

      if (error) {
        console.error(`❌ ${provider} function error:`, error);
        return { success: false, content: "", error: error.message };
      }

      console.log(`✅ Title improved via ${provider}:`, data.improvedTitle);
      return { success: true, content: data.improvedTitle };

    } catch (error) {
      console.error(`Error improving title via ${provider}:`, error);
      return { success: false, content: "", error: (error as Error).message };
    }
  }

  public async extractArticleMetadata(url: string): Promise<Partial<RssItem>> {
    try {
      console.log(`Extracting metadata for: ${url}`);
      
      // Use RSS2JSON service to extract metadata
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&api_key=${this.rss2JsonApiKey}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`RSS2JSON API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`RSS2JSON error: ${data.message || 'Unknown error'}`);
      }
      
      // Extract basic metadata
      const metadata: Partial<RssItem> = {
        title: data.feed?.title || "Artikel ohne Titel",
        description: data.feed?.description || "Keine Beschreibung verfügbar",
        link: url
      };
      
      console.log("Metadata extracted:", metadata);
      return metadata;
      
    } catch (error) {
      console.error("Error extracting metadata:", error);
      
      // Fallback: try to extract title from URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || 'article';
      const title = lastPart.replace(/[-_]/g, ' ').replace(/\.(html|php|aspx?)$/i, '');
      
      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: "Keine Beschreibung verfügbar",
        link: url
      };
    }
  }
}

export default DecoderService;
