import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Filter, TrendingUp, TrendingDown, Clock, ExternalLink, Tag, Search, RefreshCw, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import NewsService, { RssItem } from '@/services/NewsService';

// Thematische Cluster Definition
const CLUSTERS = {
  "Modellentwicklung": {
    color: "bg-blue-500",
    lightColor: "bg-blue-50",
    textColor: "text-blue-700",
    tags: ["GPT-4", "Multimodalität", "Quantisierung", "RAG", "LLM", "Transformer", "Neural Networks", "Fine-tuning"]
  },
  "Governance & Ethik": {
    color: "bg-red-500", 
    lightColor: "bg-red-50",
    textColor: "text-red-700",
    tags: ["Bias", "Deepfakes", "Regulation", "EU AI Act", "Wahlbeeinflussung", "Fairness", "Transparenz", "Privacy"]
  },
  "Education & Learning": {
    color: "bg-green-500",
    lightColor: "bg-green-50", 
    textColor: "text-green-700",
    tags: ["MOOCs", "Prompt Engineering", "Hochschule", "Feedback Tools", "E-Learning", "Tutoring", "Skills", "Training"]
  },
  "Use Cases": {
    color: "bg-purple-500",
    lightColor: "bg-purple-50",
    textColor: "text-purple-700", 
    tags: ["Healthcare", "Legal Tech", "Industrie 4.0", "Art Generator", "Automotive", "Finance", "Retail", "Gaming"]
  },
  "Geopolitische Dynamiken": {
    color: "bg-orange-500",
    lightColor: "bg-orange-50",
    textColor: "text-orange-700",
    tags: ["China", "USA", "BRICS", "EU", "Russland", "Sanctions", "Trade War", "Sovereignty"]
  },
  "Wirtschaft & Markt": {
    color: "bg-teal-500", 
    lightColor: "bg-teal-50",
    textColor: "text-teal-700",
    tags: ["Big Tech", "Startup Funding", "IPOs", "AI-as-a-Service", "Valuation", "M&A", "Investment", "Market Cap"]
  },
  "Andere": {
    color: "bg-gray-500",
    lightColor: "bg-gray-50", 
    textColor: "text-gray-700",
    tags: []
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
}

const ArticleDatabase = () => {
  const [newsService] = useState(new NewsService());
  const [articles, setArticles] = useState<EnrichedArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<EnrichedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'clusterRelevance'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('overview');
  const [clusterStats, setClusterStats] = useState<ClusterStats[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    filterAndSortArticles();
  }, [articles, searchTerm, selectedCluster, selectedTag, sortBy, sortOrder]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Loading articles for database...");
      
      // Try to get stored articles first, then fetch if needed
      let allItems: RssItem[] = [];
      try {
        allItems = await newsService.getAllStoredArticles();
        if (allItems.length === 0) {
          console.log("📰 No stored articles, fetching fresh ones...");
          allItems = await newsService.fetchNews();
        }
      } catch (error) {
        console.warn("Error getting stored articles:", error);
        allItems = await newsService.fetchNews();
      }

      console.log(`📊 Loaded ${allItems.length} articles`);

      // Enrich articles with cluster information
      const enrichedArticles = allItems.map(article => enrichArticleWithCluster(article));
      
      // Calculate cluster statistics
      const stats = calculateClusterStats(enrichedArticles);
      setClusterStats(stats);
      
      // Extract all unique tags
      const uniqueTags = [...new Set(enrichedArticles.flatMap(a => a.matchedTags))].sort();
      setAllTags(uniqueTags);

      setArticles(enrichedArticles);
      console.log("✅ Articles enriched and loaded");
      toast.success(`${enrichedArticles.length} Artikel geladen und klassifiziert`);

    } catch (error) {
      console.error('Error loading articles:', error);
      toast.error("Fehler beim Laden der Artikel");
    } finally {
      setIsLoading(false);
    }
  };

  const enrichArticleWithCluster = (article: RssItem): EnrichedArticle => {
    const text = `${article.title} ${article.description || ''}`.toLowerCase();
    let bestCluster = "Andere";
    let bestScore = 0;
    let matchedTags: string[] = [];

    // Check each cluster for matches
    Object.entries(CLUSTERS).forEach(([clusterName, clusterData]) => {
      if (clusterName === "Andere") return;
      
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
    // More specific tags get higher weights
    const highValueTags = ["GPT-4", "EU AI Act", "Deepfakes", "RAG", "Quantisierung"];
    const mediumValueTags = ["Healthcare", "Legal Tech", "Startup Funding", "China", "USA"];
    
    if (highValueTags.includes(tag)) return 3;
    if (mediumValueTags.includes(tag)) return 2;
    return 1;
  };

  const calculateRelevanceScore = (article: RssItem): number => {
    let score = 0;
    
    const relevantKeywords = [
      'KI', 'AI', 'künstliche intelligenz', 'machine learning', 'deep learning',
      'chatgpt', 'openai', 'google', 'microsoft', 'meta', 'tesla', 'nvidia',
      'startup', 'tech', 'innovation', 'digitalisierung', 'automation',
      'robotik', 'algorithmus', 'daten', 'software', 'hardware'
    ];
    
    const titleLower = article.title.toLowerCase();
    const descLower = (article.description || '').toLowerCase();
    
    relevantKeywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase())) score += 3;
      if (descLower.includes(keyword.toLowerCase())) score += 1;
    });
    
    // Recency bonus
    const daysOld = Math.floor((Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld <= 1) score += 5;
    else if (daysOld <= 3) score += 3;
    else if (daysOld <= 7) score += 1;
    
    // Source quality bonus
    if (article.sourceName === 'Eigener') score += 2;
    
    return Math.max(score, 1);
  };

  const calculateClusterStats = (articles: EnrichedArticle[]): ClusterStats[] => {
    const stats: { [key: string]: ClusterStats } = {};

    Object.keys(CLUSTERS).forEach(cluster => {
      stats[cluster] = {
        cluster,
        count: 0,
        avgRelevance: 0,
        topTags: [],
        latestDate: ''
      };
    });

    articles.forEach(article => {
      const cluster = article.cluster;
      if (!stats[cluster]) return;

      stats[cluster].count++;
      stats[cluster].avgRelevance += article.relevanceScore;
      
      // Track latest date
      const articleDate = new Date(article.pubDate).toISOString();
      if (!stats[cluster].latestDate || articleDate > stats[cluster].latestDate) {
        stats[cluster].latestDate = articleDate;
      }
    });

    // Calculate averages and top tags
    Object.values(stats).forEach(stat => {
      if (stat.count > 0) {
        stat.avgRelevance = Math.round(stat.avgRelevance / stat.count);
      }
      
      // Get top tags for this cluster
      const clusterArticles = articles.filter(a => a.cluster === stat.cluster);
      const tagCounts: { [key: string]: number } = {};
      
      clusterArticles.forEach(article => {
        article.matchedTags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      
      stat.topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);
    });

    return Object.values(stats).filter(s => s.count > 0).sort((a, b) => b.count - a.count);
  };

  const filterAndSortArticles = () => {
    let filtered = [...articles];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        (article.description || '').toLowerCase().includes(searchLower) ||
        article.matchedTags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply cluster filter
    if (selectedCluster) {
      filtered = filtered.filter(article => article.cluster === selectedCluster);
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter(article => article.matchedTags.includes(selectedTag));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.pubDate).getTime();
          bValue = new Date(b.pubDate).getTime();
          break;
        case 'clusterRelevance':
          aValue = a.clusterRelevance;
          bValue = b.clusterRelevance;
          break;
        case 'relevance':
        default:
          aValue = a.relevanceScore;
          bValue = b.relevanceScore;
          break;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    setFilteredArticles(filtered);
  };

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCluster('');
    setSelectedTag('');
    setSortBy('relevance');
    setSortOrder('desc');
    toast.success("Filter zurückgesetzt");
  };

  const getClusterBadgeProps = (cluster: string) => {
    const clusterData = CLUSTERS[cluster as keyof typeof CLUSTERS];
    return {
      className: `${clusterData.color} text-white`,
      style: { backgroundColor: clusterData.color.replace('bg-', '') }
    };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Lade Artikeldatenbank...</p>
            <p className="text-sm text-gray-600 mt-2">Artikel werden klassifiziert und sortiert</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80">
        <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Interaktive Artikel-Datenbank
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {articles.length} Artikel thematisch klassifiziert • {filteredArticles.length} angezeigt
                </p>
              </div>
            </div>
            <Button onClick={loadArticles} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters and Controls */}
      <Card className="shadow-md">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search and Filter Row */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[300px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Suche:
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Durchsuche Titel, Beschreibung und Tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Cluster:
                </label>
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Cluster</SelectItem>
                    {Object.keys(CLUSTERS).map(cluster => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Tag:
                </label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>

            {/* Sort Controls */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 self-center">Sortieren:</span>
              
              <Button
                variant={sortBy === 'relevance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('relevance')}
                className="gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                Relevanz
                {sortBy === 'relevance' && (
                  sortOrder === 'desc' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant={sortBy === 'date' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('date')}
                className="gap-1"
              >
                <Clock className="h-3 w-3" />
                Datum
                {sortBy === 'date' && (
                  sortOrder === 'desc' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant={sortBy === 'clusterRelevance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSort('clusterRelevance')}
                className="gap-1"
              >
                <Tag className="h-3 w-3" />
                Cluster-Relevanz
                {sortBy === 'clusterRelevance' && (
                  sortOrder === 'desc' ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedCluster || selectedTag) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm text-gray-600">Aktive Filter:</span>
                {searchTerm && (
                  <Badge variant="secondary">
                    Suche: {searchTerm}
                  </Badge>
                )}
                {selectedCluster && (
                  <Badge variant="secondary">
                    Cluster: {selectedCluster}
                  </Badge>
                )}
                {selectedTag && (
                  <Badge variant="secondary">
                    Tag: {selectedTag}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Cluster-Übersicht</TabsTrigger>
          <TabsTrigger value="articles">Artikel-Liste</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Cluster Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clusterStats.map((stat) => {
              const clusterData = CLUSTERS[stat.cluster as keyof typeof CLUSTERS];
              return (
                <Card key={stat.cluster} className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCluster(stat.cluster)}>
                  <CardHeader className={`${clusterData.lightColor} border-b`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-sm font-semibold ${clusterData.textColor}`}>
                        {stat.cluster}
                      </CardTitle>
                      <Badge className={clusterData.color} style={{ backgroundColor: clusterData.color.replace('bg-', '').replace('-500', '') }}>
                        {stat.count}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Ø Relevanz:</span>
                        <span className="font-medium">{stat.avgRelevance}</span>
                      </div>
                      
                      {stat.latestDate && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Neuester:</span>
                          <span className="font-medium">
                            {new Date(stat.latestDate).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      )}

                      {stat.topTags.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-gray-600 mb-1">Top Tags:</p>
                          <div className="flex flex-wrap gap-1">
                            {stat.topTags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Articles List Tab */}
        <TabsContent value="articles" className="space-y-4">
          <div className="grid gap-4">
            {filteredArticles.map((article, index) => {
              const clusterData = CLUSTERS[article.cluster as keyof typeof CLUSTERS];
              return (
                <Card key={`${article.link}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header with cluster and scores */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={`${clusterData.color} text-white`}>
                              {article.cluster}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Relevanz: {article.relevanceScore}
                            </Badge>
                            {article.clusterRelevance > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Cluster: {article.clusterRelevance}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(article.pubDate).toLocaleDateString('de-DE')}
                          </div>
                        </div>

                        {/* Title and description */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {article.title}
                          </h3>
                          {article.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {article.description.substring(0, 200)}
                              {article.description.length > 200 ? '...' : ''}
                            </p>
                          )}
                        </div>

                        {/* Tags and source */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {article.matchedTags.map(tag => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-gray-300"
                                onClick={() => setSelectedTag(tag)}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {article.sourceName}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(article.link, '_blank')}
                              className="gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Öffnen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Keine Artikel gefunden
                </h3>
                <p className="text-gray-600">
                  Versuchen Sie andere Filter oder Suchbegriffe.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cluster Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cluster-Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clusterStats.map((stat) => {
                    const percentage = Math.round((stat.count / articles.length) * 100);
                    const clusterData = CLUSTERS[stat.cluster as keyof typeof CLUSTERS];
                    
                    return (
                      <div key={stat.cluster} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className={clusterData.textColor}>{stat.cluster}</span>
                          <span className="font-medium">{stat.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${clusterData.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Häufigste Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    const tagCounts: { [key: string]: number } = {};
                    articles.forEach(article => {
                      article.matchedTags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                      });
                    });
                    
                    return Object.entries(tagCounts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([tag, count]) => (
                        <div key={tag} className="flex justify-between items-center">
                          <Badge 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100"
                            onClick={() => setSelectedTag(tag)}
                          >
                            {tag}
                          </Badge>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ));
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Temporal Distribution */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Zeitliche Verteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <span className="block font-medium">Gesamt Artikel:</span>
                      <span className="text-lg font-bold text-gray-900">{articles.length}</span>
                    </div>
                    <div>
                      <span className="block font-medium">Heute:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {articles.filter(a => {
                          const today = new Date();
                          const articleDate = new Date(a.pubDate);
                          return today.toDateString() === articleDate.toDateString();
                        }).length}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium">Diese Woche:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {articles.filter(a => {
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return new Date(a.pubDate) > weekAgo;
                        }).length}
                      </span>
                    </div>
                    <div>
                      <span className="block font-medium">Ø Relevanz:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {Math.round(articles.reduce((sum, a) => sum + a.relevanceScore, 0) / articles.length)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ArticleDatabase; 