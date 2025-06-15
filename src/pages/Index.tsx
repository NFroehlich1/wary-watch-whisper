import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, Plus, ExternalLink, ChevronDown, ChevronUp, Edit3, GraduationCap, Database } from "lucide-react";
import NewsService, { WeeklyDigest, RssItem } from "@/services/NewsService";
import { getCurrentWeek, getCurrentYear, getWeekDateRange } from "@/utils/dateUtils";
import WeeklyDigestComponent from "@/components/WeeklyDigest";
import Header from "@/components/Header";
import CustomArticleImporter from "@/components/CustomArticleImporter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

type LLMModel = 'gemini' | 'mistral';

const Index = () => {
  const { t } = useTranslation();
  const [newsService] = useState(new NewsService());
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customArticles, setCustomArticles] = useState<RssItem[]>([]);
  const [showImporter, setShowImporter] = useState(false);
  const [articleSummaries, setArticleSummaries] = useState<Record<string, string>>({});
  const [generatingSummaries, setGeneratingSummaries] = useState<Set<string>>(new Set());
  const [improvingTitles, setImprovingTitles] = useState<Set<string>>(new Set());
  const [debugLoading, setDebugLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<LLMModel>('gemini');
  const [modelTestLoading, setModelTestLoading] = useState(false);
  const [elevenLabsTestLoading, setElevenLabsTestLoading] = useState(false);
  const [geminiTestLoading, setGeminiTestLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<RssItem[]>([]);
  // AI Filter is permanently enabled - no UI toggle needed

  useEffect(() => {
    console.log("=== INDEX PAGE LOADED ===");
    console.log("Initializing NewsService...");
    
    // Debug: Show current RSS sources
    const enabledSources = newsService.getEnabledRssSources();
    const allSources = newsService.getRssSources();
    console.log("=== RSS SOURCES DEBUG ===");
    console.log("All sources:", allSources);
    console.log("Enabled sources:", enabledSources);
    console.log("Total sources:", allSources.length);
    console.log("Enabled sources count:", enabledSources.length);
    
    // Initial load with fresh fetch
    fetchNews();
  }, []);

  // Update AI model preference when selectedModel changes
  useEffect(() => {
    console.log(`🤖 Index: Updating AI model preference to ${selectedModel}`);
    newsService.setPreferredAIModel(selectedModel);
  }, [selectedModel, newsService]);

  const testLLMModel = async () => {
    setModelTestLoading(true);
    try {
      console.log(`=== DEBUG: TESTING ${selectedModel.toUpperCase()} API ===`);
      toast.info(selectedModel === 'gemini' ? t('toast.testingGemini') : t('toast.testingMistral'));
      
      const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'verify-key'
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        const errorToastKey = selectedModel === 'gemini' ? 'toast.geminiTestError' : 'toast.mistralTestError';
        toast.error(`${t(errorToastKey)} ${error.message}`);
        return;
      }

      if (data.isValid) {
        const successToastKey = selectedModel === 'gemini' ? 'toast.geminiSuccess' : 'toast.mistralSuccess';
        toast.success(`${t(successToastKey)} ${data.message}`);
      } else {
        const errorToastKey = selectedModel === 'gemini' ? 'toast.geminiError' : 'toast.mistralError';
        toast.error(`${t(errorToastKey)} ${data.message}`);
      }
    } catch (error) {
      console.error(`${selectedModel} API test error:`, error);
      const errorToastKey = selectedModel === 'gemini' ? 'toast.geminiTestError' : 'toast.mistralTestError';
      toast.error(`${t(errorToastKey)} ${(error as Error).message}`);
    } finally {
      setModelTestLoading(false);
    }
  };

  const testElevenLabsAPI = async () => {
    setElevenLabsTestLoading(true);
    try {
      console.log("=== DEBUG: TESTING ELEVEN LABS API ===");
      toast.info(t('toast.testingElevenLabs'));
      
      const { data, error } = await supabase.functions.invoke('rapid-processor', {
        body: { 
          action: 'verify-key'
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        
        // Enhanced error handling based on GitHub issue #45
        if (error instanceof FunctionsHttpError) {
          try {
            const errorMessage = await error.context.json();
            console.error('Function returned an error:', errorMessage);
            toast.error(`${t('toast.edgeFunctionError')} ${errorMessage.error || JSON.stringify(errorMessage)}`);
          } catch (jsonError) {
            try {
              const errorText = await error.context.text();
              console.error('Function returned text error:', errorText);
              toast.error(`${t('toast.edgeFunctionError')} ${errorText}`);
            } catch (textError) {
              console.error('Could not parse error response:', textError);
              toast.error(`${t('toast.edgeFunctionError')} ${t('error.httpError')} ${error.context.status || t('error.unknownStatus')}`);
            }
          }
        } else if (error instanceof FunctionsRelayError) {
          console.error('Relay error:', error.message);
          toast.error(`${t('toast.relayError')} ${error.message}`);
        } else if (error instanceof FunctionsFetchError) {
          console.error('Fetch error:', error.message);
          toast.error(`${t('toast.networkError')} ${error.message}`);
        } else {
          toast.error(`${t('toast.unknownError')} ${error.message}`);
        }
        return;
      }

      if (data.isValid) {
        toast.success(`${t('toast.elevenLabsSuccess')} ${data.message}`);
      } else {
        toast.error(`${t('toast.elevenLabsError')} ${data.message}`);
      }
    } catch (error) {
      console.error("Eleven Labs API test error:", error);
      toast.error(`${t('toast.elevenLabsTestError')} ${(error as Error).message}`);
    } finally {
      setElevenLabsTestLoading(false);
    }
  };

  const testRssLoading = async () => {
    setDebugLoading(true);
    try {
      console.log("=== DEBUG: TESTING RSS LOADING ===");
      toast.info(t('toast.testingRss'));
      
      // Force fresh fetch from RSS feeds
      const freshItems = await newsService.fetchNews();
      console.log("Fresh items fetched:", freshItems.length);
      
      if (freshItems.length > 0) {
        toast.success(`${freshItems.length} ${t('toast.rssSuccess')}`);
        // Refresh the display
        fetchNews();
      } else {
        toast.warning(t('toast.rssNoArticles'));
      }
    } catch (error) {
      console.error("Debug RSS loading error:", error);
      toast.error(`${t('toast.rssError')} ${(error as Error).message}`);
    } finally {
      setDebugLoading(false);
    }
  };

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      console.log("=== FETCHING NEWS ===");
      
      // Try to get stored articles first, fallback to fetching fresh ones
      let allItems: RssItem[] = [];
      try {
        allItems = await newsService.getStoredArticlesForCurrentWeek();
        if (allItems.length === 0) {
          console.log("No stored articles found, fetching fresh ones...");
          allItems = await newsService.fetchNews();
        }
      } catch (error) {
        console.warn("Error getting stored articles, fetching fresh ones:", error);
        allItems = await newsService.fetchNews();
      }

      // Store all items for filtering
      setNewsItems(allItems);

      // Mark custom articles as such and combine with regular articles
      const markedCustomArticles = customArticles.map(article => ({
        ...article,
        sourceName: 'Eigener',
        isCustom: true
      }));
      
      const combinedItems = [...allItems, ...markedCustomArticles];
      
      // Filter for current week and create digest
      const currentWeekItems = newsService.filterCurrentWeekNews(combinedItems);
      const weekDigests = newsService.groupNewsByWeek(currentWeekItems);
      
      const currentWeek = getCurrentWeek();
      const currentYear = getCurrentYear();
      const weekKey = `${currentYear}-W${currentWeek.toString().padStart(2, '0')}`;
      
      if (weekDigests[weekKey]) {
        setDigest(weekDigests[weekKey]);
        console.log(`✅ Found ${weekDigests[weekKey].items.length} articles for current week`);
      } else {
        // Create empty digest for current week with all required properties
        const emptyDigest: WeeklyDigest = {
          id: `${currentYear}-W${currentWeek.toString().padStart(2, '0')}-${Date.now()}`,
          weekNumber: currentWeek,
          year: currentYear,
          dateRange: getWeekDateRange(currentWeek, currentYear),
          title: `KW ${currentWeek}/${currentYear}`,
          summary: "Noch keine Zusammenfassung erstellt",
          items: combinedItems,
          generatedContent: null,
          createdAt: new Date()
        };
        setDigest(emptyDigest);
        console.log(`📅 Created digest for week ${currentWeek}/${currentYear} with ${combinedItems.length} articles`);
      }
      
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error(`${t('general.error')}: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomArticleAdded = async (article: RssItem) => {
    // Check if article with same URL/GUID already exists in the local list
    const isDuplicate = customArticles.some(existingArticle => 
      existingArticle.guid === article.guid || 
      existingArticle.link === article.link
    );

    if (isDuplicate) {
      toast.warning(t('index.duplicateArticle'));
      return;
    }

    try {
      // Save custom article to database
      console.log("💾 Saving custom article to database:", article.title);
      await newsService.saveCustomArticle(article);
      
      setCustomArticles(prev => [...prev, article]);
      setShowImporter(false);
      
      toast.success(t('index.articleAdded'));
      
      // Refresh the digest with the new article
      setTimeout(() => {
        fetchNews();
      }, 100);
    } catch (error) {
      console.error("Error saving custom article:", error);
      toast.error(t('index.errorSavingArticle'));
    }
  };

  const improveArticleTitle = async (articleGuid: string) => {
    const article = customArticles.find(a => a.guid === articleGuid);
    if (!article) return;

    setImprovingTitles(prev => new Set(prev).add(articleGuid));
    
    try {
      console.log("Improving title for custom article:", article.title);
      
      // Use the DecoderService's improved title function which has fallback logic
      const improvedTitle = await newsService.getDecoderService().improveArticleTitle(article.title, article.description);

      if (improvedTitle) {
        // Update the article title in the customArticles state
        setCustomArticles(prev => prev.map(a => 
          a.guid === articleGuid 
            ? { ...a, title: improvedTitle }
            : a
        ));
        toast.success(t('toast.titleImproved'));
        console.log("Article title improved successfully");
      } else {
        toast.error(t('index.noImprovedTitle'));
      }
    } catch (error) {
      console.error("Error improving article title:", error);
      toast.error(t('index.errorImprovingTitle'));
    } finally {
      setImprovingTitles(prev => {
        const newSet = new Set(prev);
        newSet.delete(articleGuid);
        return newSet;
      });
    }
  };

  // Listen for RSS source changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rss_sources' && newsItems.length > 0) {
        console.log("📡 RSS sources changed, filtering articles");
        
        // Always use the enhanced AI/Data Science filtering
        const filteredItems = newsService.filterArticlesByEnabledSources(newsItems);
        
        // Update the digest with filtered items
        if (digest) {
          const updatedDigest = {
            ...digest,
            items: [...filteredItems, ...customArticles.map(article => ({
              ...article,
              sourceName: 'Eigener',
              isCustom: true
            }))]
          };
          setDigest(updatedDigest);
        }
        
        if (filteredItems.length !== newsItems.length) {
          toast.success(`🎯 KI/Data Science Filter: ${filteredItems.length} von ${newsItems.length} Artikeln angezeigt`);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [newsItems, digest, customArticles, newsService]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 {t('index.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {t('index.subtitle')}
          </p>
          
          {/* Navigation Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link to="/student-news">
              <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
                <GraduationCap className="h-4 w-4 mr-2" />
                {t('index.top10Students')}
              </Button>
            </Link>
            
            <Link to="/interactive-database">
              <Button variant="outline" className="bg-purple-50 border-purple-200 hover:bg-purple-100">
                <Database className="h-4 w-4 mr-2" />
                {t('index.searchDatabase')}
              </Button>
            </Link>
          </div>
          
                    {/* Debug Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button 
              onClick={testRssLoading}
              disabled={debugLoading}
              variant="outline" 
              className="bg-orange-50 border-orange-200 hover:bg-orange-100"
            >
              {debugLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {debugLoading ? t('index.testing') : t('index.rssDebugTest')}
            </Button>
            
            {/* LLM Model Selection and Test */}
            <div className="flex gap-2 items-center">
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as LLMModel)}>
                <SelectTrigger className="w-32 bg-blue-50 border-blue-200 hover:bg-blue-100">
                  <SelectValue placeholder={t('index.selectModel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={testLLMModel}
                disabled={modelTestLoading}
                variant="outline" 
                className="bg-blue-50 border-blue-200 hover:bg-blue-100"
              >
                {modelTestLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {modelTestLoading ? t('index.testingModel') : t('index.testApiModel')}
              </Button>
            </div>
            
            <Button 
              onClick={testElevenLabsAPI}
              disabled={elevenLabsTestLoading}
              variant="outline" 
              className="bg-green-50 border-green-200 hover:bg-green-100"
            >
              {elevenLabsTestLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {elevenLabsTestLoading ? t('index.testing') : t('index.elevenLabsTest')}
            </Button>
          </div>
        </div>

        {/* Add Article Component */}
        <div className="max-w-4xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('index.addArticle')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImporter(!showImporter)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {customArticles.length} {t('index.customArticlesCount')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showImporter && (
                <div className="mb-4">
                  <CustomArticleImporter 
                    onArticleAdded={handleCustomArticleAdded}
                    newsService={newsService}
                  />
                </div>
              )}
              
              {customArticles.length === 0 ? (
                <div className="text-center py-4">
                  <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">{t('index.noCustomArticles')}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('index.clickPlusToAdd')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('index.customArticleDescription')} 
                    <Badge variant="custom" className="mx-1 text-xs">{t('index.customArticleLabel')}</Badge>
                    {t('index.customArticleDescription2')}
                  </p>
                  <div className="text-xs text-gray-500">
                    {customArticles.length} {t('index.articlesAdded')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8 mb-8">
          {/* Main content area - full width so it can center itself properly */}
          <div>
            {isLoading ? (
              <Card className="mb-8 max-w-4xl mx-auto">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : digest ? (
              <WeeklyDigestComponent 
                digest={digest} 
                apiKey={newsService.getGeminiApiKey()}
                newsService={newsService}
                selectedModel={selectedModel}
              />
            ) : (
              <Card className="max-w-4xl mx-auto">
                <CardContent className="py-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{t('index.noNewsFound')}</p>
                  <Button 
                    onClick={fetchNews} 
                    variant="outline" 
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('index.tryAgain')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
