import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Filter, TrendingUp, TrendingDown, Clock, ExternalLink, Tag, Search, RefreshCw, Calendar, BarChart3, Grid3X3, List } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import NewsService, { RssItem } from '@/services/NewsService';
import NewsCard from '@/components/NewsCard';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/contexts/TranslationContext';

// Spezifische Cluster Definition für die interaktive Datenbank
const AI_CLUSTERS = {
  "Modellentwicklung": {
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    tags: ["GPT-4", "Multimodalität", "Quantisierung", "RAG", "LLM", "Transformer", "Neural Networks", "Fine-tuning", "BERT", "Claude", "Llama"],
    description: "Fortschritte in der KI-Modellentwicklung und -architektur"
  },
  "Governance & Ethik": {
    color: "bg-red-500", 
    lightColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    tags: ["Bias", "Deepfakes", "Regulation", "EU AI Act", "Wahlbeeinflussung", "Fairness", "Transparenz", "Privacy", "Ethics", "GDPR"],
    description: "Ethische Herausforderungen und regulatorische Entwicklungen"
  },
  "Education & Learning": {
    color: "bg-green-500",
    lightColor: "bg-green-50", 
    textColor: "text-green-700",
    borderColor: "border-green-200",
    tags: ["MOOCs", "Prompt Engineering", "Hochschule", "Feedback Tools", "E-Learning", "Tutoring", "Skills", "Training", "Coursera", "Khan Academy"],
    description: "KI in der Bildung und Lernprozessen"
  },
  "Use Cases": {
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-700", 
    borderColor: "border-purple-200",
    tags: ["Healthcare", "Legal Tech", "Industrie 4.0", "Art Generator", "Automotive", "Finance", "Retail", "Gaming", "Medicine", "Robotics"],
    description: "Praktische Anwendungen von KI in verschiedenen Branchen"
  },
  "Geopolitische Dynamiken": {
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    tags: ["China", "USA", "BRICS", "EU", "Russland", "Sanctions", "Trade War", "Sovereignty", "Taiwan", "Export Controls"],
    description: "Internationale KI-Politik und geopolitische Spannungen"
  },
  "Wirtschaft & Markt": {
    color: "bg-teal-500", 
    lightColor: "bg-teal-50",
    textColor: "text-teal-700",
    borderColor: "border-teal-200",
    tags: ["Big Tech", "Startup Funding", "IPOs", "AI-as-a-Service", "Valuation", "M&A", "Investment", "Market Cap", "OpenAI", "Google", "Microsoft"],
    description: "Marktentwicklungen und wirtschaftliche Aspekte der KI"
  }
};

interface EnrichedArticle extends RssItem {
  cluster: string;
  matchedTags: string[];
  relevanceScore: number;
  clusterRelevance: number;
}

interface ClusterStats {
  cluster: string;
  count: number;
  avgRelevance: number;
  topTags: string[];
  latestDate: string;
  articles: EnrichedArticle[];
}

const InteractiveDatabase = () => {
  const { t } = useTranslation();

  // Helper function to get translated cluster name
  const getClusterName = (clusterKey: string): string => {
    const keyMap: { [key: string]: string } = {
      "Modellentwicklung": "clusters.modellentwicklung",
      "Governance & Ethik": "clusters.governanceEthik", 
      "Education & Learning": "clusters.educationLearning",
      "Use Cases": "clusters.useCases",
      "Geopolitische Dynamiken": "clusters.geopolitischeDynamiken",
      "Wirtschaft & Markt": "clusters.wirtschaftMarkt"
    };
    return t(keyMap[clusterKey] || clusterKey);
  };

  // Helper function to get translated cluster description
  const getClusterDescription = (clusterKey: string): string => {
    const keyMap: { [key: string]: string } = {
      "Modellentwicklung": "clusters.modellentwicklungDesc",
      "Governance & Ethik": "clusters.governanceEthikDesc",
      "Education & Learning": "clusters.educationLearningDesc", 
      "Use Cases": "clusters.useCasesDesc",
      "Geopolitische Dynamiken": "clusters.geopolitischeDynamikenDesc",
      "Wirtschaft & Markt": "clusters.wirtschaftMarktDesc"
    };
    return t(keyMap[clusterKey] || AI_CLUSTERS[clusterKey as keyof typeof AI_CLUSTERS]?.description || clusterKey);
  };
  const [newsService] = useState(new NewsService());
  const [articles, setArticles] = useState<EnrichedArticle[]>([]);
  const [clusterStats, setClusterStats] = useState<ClusterStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'clusterRelevance'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  console.log("🚀 InteractiveDatabase component rendered with state:", {
    isLoading,
    error,
    articlesLength: articles.length,
    clusterStatsLength: clusterStats.length
  });

  useEffect(() => {
    console.log("🚀 InteractiveDatabase component mounted");
    loadArticles();
  }, []);

  const loadArticles = async () => {
    console.log("📋 Starting loadArticles...");
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Loading articles for interactive database...");
      
      // Get stored articles or fetch fresh ones
      let allItems: RssItem[] = [];
      try {
        console.log("📊 Attempting to get all stored articles...");
        // Try getting all stored articles first
        allItems = await newsService.getAllStoredArticles(500); // Limit to 500 articles for performance
        console.log(`✅ Got ${allItems.length} stored articles`);
        
        if (allItems.length === 0) {
          console.log("📰 No stored articles, fetching fresh ones...");
          allItems = await newsService.fetchNews();
          console.log(`📰 Fetched ${allItems.length} fresh articles`);
        }
      } catch (error) {
        console.warn("Error getting stored articles:", error);
        console.log("🔄 Falling back to fetchNews...");
        allItems = await newsService.fetchNews();
        console.log(`🔄 Fallback got ${allItems.length} articles`);
      }

      console.log(`📊 Total loaded: ${allItems.length} articles`);

      if (allItems.length === 0) {
        console.warn("⚠️ No articles found at all!");
        setError(t('database.noArticlesFoundError'));
        return;
      }

      // Enrich articles with cluster information
      console.log("🏷️ Enriching articles with cluster information...");
      const enrichedArticles = allItems.map(article => enrichArticleWithCluster(article));
      console.log(`🏷️ Enriched ${enrichedArticles.length} articles`);
      
      // Calculate cluster statistics
      console.log("📈 Calculating cluster statistics...");
      const stats = calculateClusterStats(enrichedArticles);
      console.log(`📈 Calculated stats for ${stats.length} clusters`);
      setClusterStats(stats);

      setArticles(enrichedArticles);
      console.log("✅ Articles enriched and loaded for interactive database");
      toast.success(`${enrichedArticles.length} ${t('database.articlesLoadedAndClassified')}`);

    } catch (error) {
      console.error('❌ Error loading articles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setError(`${t('database.errorLoadingArticles')}: ${errorMessage}`);
      toast.error(t('database.errorLoadingArticles'));
    } finally {
      setIsLoading(false);
      console.log("🏁 loadArticles finished");
    }
  };

  const enrichArticleWithCluster = (article: RssItem): EnrichedArticle => {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    let bestCluster = "";
    let bestScore = 0;
    let matchedTags: string[] = [];

    // Check each cluster for matches
    Object.entries(AI_CLUSTERS).forEach(([clusterName, clusterData]) => {
      let clusterScore = 0;
      let clusterTags: string[] = [];

      clusterData.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (text.includes(tagLower)) {
          clusterScore += getTagWeight(tag);
          clusterTags.push(tag);
        }
      });

      if (clusterScore > bestScore) {
        bestScore = clusterScore;
        bestCluster = clusterName;
        matchedTags = clusterTags;
      }
    });

    // Fallback: If no cluster was found but article contains general AI terms, assign to a default cluster
    if (!bestCluster || bestScore === 0) {
      const generalAiKeywords = ['ki', 'ai', 'artificial', 'intelligence', 'künstliche', 'intelligenz', 'machine learning', 'deep learning'];
      const hasAiContent = generalAiKeywords.some(keyword => text.includes(keyword));
      
      if (hasAiContent) {
        // Default to "Use Cases" for general AI content
        bestCluster = "Use Cases";
        bestScore = 1;
        matchedTags = ["AI"];
      }
    }

    // Calculate overall relevance score
    const relevanceScore = calculateRelevanceScore(article);
    
    return {
      ...article,
      cluster: bestCluster,
      matchedTags,
      relevanceScore,
      clusterRelevance: bestScore
    };
  };

  const getTagWeight = (tag: string): number => {
    // Higher weights for more specific and current terms
    const highValueTags = ["GPT-4", "EU AI Act", "Deepfakes", "RAG", "Quantisierung", "Claude", "Llama"];
    const mediumValueTags = ["Healthcare", "Legal Tech", "Startup Funding", "China", "USA", "OpenAI", "Google"];
    
    if (highValueTags.includes(tag)) return 3;
    if (mediumValueTags.includes(tag)) return 2;
    return 1;
  };

  const calculateRelevanceScore = (article: RssItem): number => {
    let score = 0;
    
    const relevantKeywords = [
      'KI', 'AI', 'artificial intelligence', 'künstliche intelligenz', 'machine learning', 'deep learning',
      'chatgpt', 'openai', 'google', 'microsoft', 'meta', 'anthropic', 'claude',
      'llm', 'large language model', 'transformer', 'neural network'
    ];
    
    const titleLower = article.title.toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    
    // Score based on keyword presence
    relevantKeywords.forEach(keyword => {
      if (titleLower.includes(keyword)) score += 2;
      if (descLower.includes(keyword)) score += 1;
    });
    
    // Boost score for recent articles
    const daysSincePublish = (Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublish <= 1) score += 3;
    else if (daysSincePublish <= 7) score += 2;
    else if (daysSincePublish <= 30) score += 1;
    
    return score;
  };

  const calculateClusterStats = (articles: EnrichedArticle[]): ClusterStats[] => {
    const stats: { [key: string]: ClusterStats } = {};
    
    // Initialize stats for all clusters
    Object.keys(AI_CLUSTERS).forEach(cluster => {
      stats[cluster] = {
        cluster,
        count: 0,
        avgRelevance: 0,
        topTags: [],
        latestDate: '',
        articles: []
      };
    });

    // Group articles by cluster
    articles.forEach(article => {
      if (article.cluster && stats[article.cluster]) {
        stats[article.cluster].articles.push(article);
        stats[article.cluster].count++;
      }
    });

    // Calculate statistics for each cluster
    Object.values(stats).forEach(stat => {
      if (stat.articles.length > 0) {
        // Calculate average relevance
        stat.avgRelevance = stat.articles.reduce((sum, a) => sum + a.relevanceScore, 0) / stat.articles.length;
        
        // Get latest date
        stat.latestDate = stat.articles
          .map(a => a.pubDate)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
        
        // Get top tags
        const tagCounts: { [key: string]: number } = {};
        stat.articles.forEach(article => {
          article.matchedTags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });
        
        stat.topTags = Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([tag]) => tag);
      }
    });

    return Object.values(stats).filter(stat => stat.count > 0);
  };

  const getFilteredArticles = () => {
    let filtered = articles;

    // Filter by cluster
    if (selectedCluster && selectedCluster !== 'all') {
      filtered = filtered.filter(article => article.cluster === selectedCluster);
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(article => article.cluster === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.matchedTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Sort articles
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'relevance':
          aValue = a.relevanceScore;
          bValue = b.relevanceScore;
          break;
        case 'clusterRelevance':
          aValue = a.clusterRelevance;
          bValue = b.clusterRelevance;
          break;
        case 'date':
          aValue = new Date(a.pubDate).getTime();
          bValue = new Date(b.pubDate).getTime();
          break;
        default:
          return 0;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  };

  const getClusterConfig = (cluster: string) => {
    return AI_CLUSTERS[cluster as keyof typeof AI_CLUSTERS] || {
      color: "bg-gray-500",
      lightColor: "bg-gray-50",
      textColor: "text-gray-700",
      borderColor: "border-gray-200",
      tags: [],
      description: ""
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-600 mb-2">{t('database.errorLoading')}</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={loadArticles} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('database.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  console.log("🎨 Rendering InteractiveDatabase with:", {
    articlesCount: articles.length,
    clusterStatsCount: clusterStats.length,
    activeTab,
    selectedCluster,
    searchTerm
  });

  const filteredArticles = getFilteredArticles();
  console.log("🔍 Filtered articles:", filteredArticles.length);

  // No articles state (different from error state)
  if (!isLoading && !error && articles.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              {t('database.title')}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('database.subtitle')}
            </p>
          </div>
          
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('database.noArticlesAvailable')}</h3>
            <p className="text-gray-500 mb-4">
              {t('database.loadArticlesFirst')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={loadArticles} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('database.loadArticles')}
              </Button>
              <a href="/" className="inline-block">
                <Button variant="default">
                  {t('database.toMainPage')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            {t('database.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('database.subtitle')}
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('database.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCluster} onValueChange={setSelectedCluster}>
              <SelectTrigger>
                <SelectValue placeholder={t('database.selectCluster')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('database.allClusters')}</SelectItem>
                {Object.keys(AI_CLUSTERS).map(cluster => (
                  <SelectItem key={cluster} value={cluster}>
                    {getClusterName(cluster)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">{t('database.sortByRelevance')}</SelectItem>
                <SelectItem value="clusterRelevance">{t('database.sortByClusterRelevance')}</SelectItem>
                <SelectItem value="date">{t('database.sortByDate')}</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={sortOrder === 'desc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('desc')}
                className="flex-1"
              >
                <TrendingDown className="h-4 w-4 mr-1" />
                {t('database.descending')}
              </Button>
              <Button
                variant={sortOrder === 'asc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortOrder('asc')}
                className="flex-1"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                {t('database.ascending')}
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                {t('database.cards')}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                {t('database.list')}
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              {filteredArticles.length} {t('database.articlesOf')} {articles.length} {t('database.articles')}
            </div>
          </div>
        </div>

        {/* Cluster Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="all">{t('database.all')}</TabsTrigger>
            {Object.entries(AI_CLUSTERS).map(([cluster, config]) => (
              <TabsTrigger key={cluster} value={cluster} className={`text-xs ${config.textColor}`}>
                {getClusterName(cluster).replace('&', '&')}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            {/* Cluster Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {clusterStats.map(stat => {
                const config = getClusterConfig(stat.cluster);
                return (
                  <Card key={stat.cluster} className={`${config.lightColor} ${config.borderColor} border-2 hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => setActiveTab(stat.cluster)}>
                    <CardHeader className="pb-2">
                      <CardTitle className={`text-lg ${config.textColor} flex items-center justify-between`}>
                        <span>{getClusterName(stat.cluster)}</span>
                        <Badge variant="secondary" className={config.color}>
                          {stat.count}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">{getClusterDescription(stat.cluster)}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {stat.topTags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>⭐ {stat.avgRelevance.toFixed(1)}</span>
                        <span>📅 {new Date(stat.latestDate).toLocaleDateString('de-DE')}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {Object.keys(AI_CLUSTERS).map(cluster => (
            <TabsContent key={cluster} value={cluster}>
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{getClusterName(cluster)}</h3>
                <p className="text-gray-600">{getClusterDescription(cluster)}</p>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Articles Grid/List */}
        {filteredArticles.length > 0 ? (
          <div className={viewMode === 'cards' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredArticles.map((article, index) => (
              <div key={article.guid || index} className="relative">
                <NewsCard 
                  item={article}
                  isLoading={false}
                />
                {/* Cluster Badge */}
                {article.cluster && (
                  <div className="absolute top-2 right-2 z-20">
                    <Badge 
                      className={`${getClusterConfig(article.cluster).color} text-white text-xs shadow-sm`}
                    >
                      {getClusterName(article.cluster)}
                    </Badge>
                  </div>
                )}
                {/* Matched Tags */}
                {article.matchedTags.length > 0 && (
                  <div className="absolute bottom-3 left-3 right-3 z-10">
                    <div className="flex flex-wrap gap-1.5">
                      {article.matchedTags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs bg-white/95 backdrop-blur-sm shadow-sm border-gray-200">
                          {tag}
                        </Badge>
                      ))}
                      {article.matchedTags.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white/95 backdrop-blur-sm shadow-sm border-gray-200">
                          +{article.matchedTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Database className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('database.noArticlesFoundInFilter')}</h3>
            <p className="text-gray-500">
              {searchTerm || (selectedCluster && selectedCluster !== 'all')
                ? t('database.tryDifferentSearch')
                : t('database.reloadToLoad')
              }
            </p>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center mt-8">
          <Button onClick={loadArticles} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {t('database.reloadArticles')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDatabase; 