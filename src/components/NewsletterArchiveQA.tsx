import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, MessageSquare, Archive, Bot, User, Calendar, Hash, RefreshCw, Send, TrendingUp, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import NewsService, { RssItem } from '@/services/NewsService';
import { getCurrentWeek, getCurrentYear } from '@/utils/dateUtils';
import VoiceInput from './VoiceInput';

interface Newsletter {
  id: string;
  title: string;
  content: string;
  date_range: string;
  week_number: number;
  year: number;
  article_count: number;
  created_at: string;
}

interface SearchResult {
  newsletters: Newsletter[];
  count: number;
  query: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  relatedNewsletters?: Newsletter[];
}

const NewsletterArchiveQA = () => {
  const { toast } = useToast();
  const [newsService] = useState(new NewsService());
  const [searchQuery, setSearchQuery] = useState('');
  const [qaQuery, setQaQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [currentWeekArticles, setCurrentWeekArticles] = useState<RssItem[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Generate year options (current year and previous years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);
  
  // Generate week options (1-52)
  const weekOptions = Array.from({ length: 52 }, (_, i) => i + 1);

  // Static fallback questions
  const fallbackQuestions = [
    "Welche wichtigen KI-Entwicklungen wurden 2024 berichtet?",
    "Was wurde über ChatGPT und OpenAI geschrieben?",
    "Welche neuen Machine Learning Tools wurden vorgestellt?",
    "Gab es Berichte über ethische KI-Themen?"
  ];

  useEffect(() => {
    loadCurrentWeekArticlesAndGenerateQuestions();
  }, []);

  const loadCurrentWeekArticlesAndGenerateQuestions = async () => {
    setIsLoadingQuestions(true);
    console.log("🔄 Loading current week articles for dynamic questions...");
    
    try {
      // Load current week's top articles
      let allItems: RssItem[] = [];
      try {
        allItems = await newsService.getStoredArticlesForCurrentWeek();
        if (allItems.length === 0) {
          console.log("📰 No stored articles found, fetching fresh ones...");
          allItems = await newsService.fetchNews();
        }
      } catch (error) {
        console.warn("Error getting articles for questions:", error);
        allItems = await newsService.fetchNews();
      }

      // Filter and rank current week articles
      const currentWeekItems = newsService.filterCurrentWeekNews(allItems);
      const rankedArticles = currentWeekItems
        .map(article => ({
          ...article,
          relevanceScore: calculateRelevanceScore(article)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 10); // Top 10

      console.log(`📊 Found ${rankedArticles.length} ranked articles for question generation`);
      console.log("🔝 Top 3 articles:", rankedArticles.slice(0, 3).map(a => a.title));

      setCurrentWeekArticles(rankedArticles);

      // Generate dynamic questions based on current articles
      if (rankedArticles.length > 0) {
        const questions = generateDynamicQuestions(rankedArticles);
        console.log("❓ Generated dynamic questions:", questions);
        setDynamicQuestions(questions);
      } else {
        console.log("⚠️ No articles available, using fallback questions");
        setDynamicQuestions(fallbackQuestions);
      }

    } catch (error) {
      console.error('Error loading articles for questions:', error);
      setDynamicQuestions(fallbackQuestions);
    } finally {
      setIsLoadingQuestions(false);
    }
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
    
    const daysOld = Math.floor((Date.now() - new Date(article.pubDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld <= 1) score += 5;
    else if (daysOld <= 3) score += 3;
    else if (daysOld <= 7) score += 1;
    
    if (article.sourceName === 'Eigener') score += 2;
    
    const reliableSources = ['techcrunch', 'wired', 'ars technica', 'the verge'];
    const sourceLower = (article.sourceName || '').toLowerCase();
    if (reliableSources.some(source => sourceLower.includes(source))) score += 2;
    
    return Math.max(score, 1);
  };

  const generateDynamicQuestions = (articles: RssItem[]): string[] => {
    const questions: string[] = [];
    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    
    // Extract key topics from article titles
    const topics = new Set<string>();
    const companies = new Set<string>();
    const technologies = new Set<string>();

    articles.forEach(article => {
      const title = article.title.toLowerCase();
      
      // Detect companies
      if (title.includes('openai') || title.includes('chatgpt')) companies.add('OpenAI');
      if (title.includes('google') || title.includes('gemini')) companies.add('Google');
      if (title.includes('microsoft') || title.includes('copilot')) companies.add('Microsoft');
      if (title.includes('meta') || title.includes('facebook')) companies.add('Meta');
      if (title.includes('tesla') || title.includes('musk')) companies.add('Tesla');
      if (title.includes('nvidia')) companies.add('NVIDIA');
      if (title.includes('apple')) companies.add('Apple');
      
      // Detect technologies
      if (title.includes('ki') || title.includes('ai') || title.includes('artificial intelligence')) technologies.add('KI/AI');
      if (title.includes('machine learning') || title.includes('ml')) technologies.add('Machine Learning');
      if (title.includes('deep learning') || title.includes('neural')) technologies.add('Deep Learning');
      if (title.includes('llm') || title.includes('language model')) technologies.add('Large Language Models');
      if (title.includes('roboter') || title.includes('robot')) technologies.add('Robotik');
      if (title.includes('blockchain') || title.includes('crypto')) technologies.add('Blockchain');
      if (title.includes('quantum')) technologies.add('Quantum Computing');
      
      // Detect general topics
      if (title.includes('startup') || title.includes('funding') || title.includes('investment')) topics.add('Startup-Investments');
      if (title.includes('ethik') || title.includes('regulation') || title.includes('gesetz')) topics.add('KI-Ethik und Regulierung');
      if (title.includes('job') || title.includes('karriere') || title.includes('ausbildung')) topics.add('Tech-Karriere');
      if (title.includes('sicherheit') || title.includes('security') || title.includes('privacy')) topics.add('IT-Sicherheit');
    });

    // Generate questions based on current week's content
    questions.push(`Welche wichtigen Tech-News gab es in KW ${currentWeek}/${currentYear}?`);

    // Company-based questions
    Array.from(companies).slice(0, 2).forEach(company => {
      questions.push(`Was wurde diese Woche über ${company} berichtet?`);
    });

    // Technology-based questions
    Array.from(technologies).slice(0, 2).forEach(tech => {
      questions.push(`Welche Entwicklungen gab es bei ${tech} in den letzten Newslettern?`);
    });

    // Topic-based questions
    Array.from(topics).slice(0, 2).forEach(topic => {
      questions.push(`Was wurde zu ${topic} in vergangenen Newslettern diskutiert?`);
    });

    // Add some general comparison questions if we have diverse content
    if (companies.size > 1) {
      questions.push(`Wie unterscheiden sich die KI-Strategien der großen Tech-Unternehmen?`);
    }
    
    if (articles.length >= 5) {
      questions.push(`Welche Trends zeichnen sich aus den aktuellen Top-Artikeln ab?`);
    }

    // Ensure we have at least 4 questions, fallback to static ones if needed
    while (questions.length < 4 && questions.length < fallbackQuestions.length) {
      const fallbackIndex = questions.length;
      if (fallbackIndex < fallbackQuestions.length) {
        questions.push(fallbackQuestions[fallbackIndex]);
      }
    }

    return questions.slice(0, 6); // Limit to 6 questions max
  };

  // Function to convert newsletter references to clickable links
  const processNewsletterLinks = (content: string, relatedNewsletters?: Newsletter[]): string => {
    if (!relatedNewsletters || relatedNewsletters.length === 0) {
      return content;
    }

    // Pattern to match newsletter references like "Newsletter 2024/KW12", "KW 34", etc.
    const newsletterPattern = /\b(?:Newsletter\s+)?(\d{4})\/KW\s?(\d{1,2})\b/gi;
    
    return content.replace(newsletterPattern, (match, year, week) => {
      const foundNewsletter = relatedNewsletters.find(nl => 
        nl.year === parseInt(year) && nl.week_number === parseInt(week)
      );
      
      if (foundNewsletter) {
        // Create markdown link with newsletter title
        return `[${match}: "${foundNewsletter.title}"](#newsletter-${foundNewsletter.id})`;
      }
      
      return match; // Return original if newsletter not found
    });
  };

  // Custom ReactMarkdown component with enhanced link handling for newsletters
  const MarkdownWithNewsletterLinks = ({ content, relatedNewsletters }: { content: string, relatedNewsletters?: Newsletter[] }) => {
    const processedContent = processNewsletterLinks(content, relatedNewsletters);
    
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-700">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          a: ({ href, children, ...props }) => {
            // Handle newsletter links specially
            if (href?.startsWith('#newsletter-')) {
              const newsletterId = href.replace('#newsletter-', '');
              const newsletter = relatedNewsletters?.find(nl => nl.id === newsletterId);
              
              return (
                <button
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline decoration-blue-600/30 hover:decoration-blue-800 transition-colors cursor-pointer"
                  onClick={() => {
                    if (newsletter) {
                      // Scroll to newsletter in search results or show details
                      const element = document.getElementById(`newsletter-${newsletterId}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                        setTimeout(() => {
                          element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                        }, 2000);
                      }
                      toast({
                        title: "Newsletter gefunden",
                        description: `"${newsletter.title}" - ${newsletter.year}/KW${newsletter.week_number}`
                      });
                    }
                  }}
                  title={newsletter ? `Zeige Newsletter: ${newsletter.title}` : 'Newsletter anzeigen'}
                  {...props}
                >
                  {children}
                  <Archive className="h-3 w-3" />
                </button>
              );
            }
            
            // Regular external links
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline decoration-blue-600/30 hover:decoration-blue-800 transition-colors"
                title={`Öffne ${href} in neuem Tab`}
                {...props}
              >
                {children}
                <ExternalLink className="h-3 w-3" />
              </a>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Suchbegriff ein",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Direct database search for newsletters
      let dbQuery = supabase
        .from('newsletter_archive')
        .select('*')
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply filters
      if (selectedYear) {
        dbQuery = dbQuery.eq('year', parseInt(selectedYear));
      }
      if (selectedWeek) {
        dbQuery = dbQuery.eq('week_number', parseInt(selectedWeek));
      }

      const { data: newsletters, error } = await dbQuery;

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      const searchData = {
        newsletters: newsletters || [],
        count: newsletters?.length || 0,
        query: searchQuery
      };

      setSearchResults(searchData);
      
      if (searchData.count === 0) {
        toast({
          title: "Keine Ergebnisse",
          description: "Keine Newsletter gefunden, die Ihrer Suche entsprechen"
        });
      } else {
        toast({
          title: "Suche erfolgreich",
          description: `${searchData.count} Newsletter gefunden`
        });
      }

    } catch (error) {
      console.error('Search failed:', error);
      toast({
        title: "Fehler",
        description: "Suche fehlgeschlagen: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleQA = async () => {
    if (!qaQuery.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte stellen Sie eine Frage",
        variant: "destructive"
      });
      return;
    }

    setIsAsking(true);
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: qaQuery,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      // First get relevant newsletters
      let searchQuery = supabase
        .from('newsletter_archive')
        .select('*')
        .or(`title.ilike.%${qaQuery}%,content.ilike.%${qaQuery}%`)
        .order('created_at', { ascending: false })
        .limit(15);

      // Apply filters if set
      if (selectedYear) {
        searchQuery = searchQuery.eq('year', parseInt(selectedYear));
      }
      if (selectedWeek) {
        searchQuery = searchQuery.eq('week_number', parseInt(selectedWeek));
      }

      const { data: newsletters, error: searchError } = await searchQuery;

      if (searchError) {
        throw new Error(`Search failed: ${searchError.message}`);
      }

      const newsletterList = newsletters || [];
      
      // Combine newsletter content for context
      const newsletterContent = newsletterList.map(nl => 
        `Newsletter ${nl.year}/KW${nl.week_number}: ${nl.title}\n${nl.content.substring(0, 2000)}`
      ).join('\n\n---\n\n');

      // Call gemini-ai with qa-with-newsletter action
      const { data, error } = await supabase.functions.invoke('gemini-ai', {
        body: {
          action: 'qa-with-newsletter',
          data: {
            question: qaQuery,
            newsletter: newsletterContent || `Newsletter-Archive durchsucht. ${newsletterList.length} relevante Newsletter gefunden.`
          }
        }
      });

      if (error) {
        console.error('Q&A error:', error);
        toast({
          title: "Fehler",
          description: "Fehler beim Beantworten der Frage: " + error.message,
          variant: "destructive"
        });
        return;
      }

      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.answer || 'Keine Antwort erhalten',
        timestamp: new Date(),
        relatedNewsletters: newsletterList.slice(0, 5)
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      toast({
        title: "Antwort generiert",
        description: `Antwort basierend auf ${newsletterList.length} Newsletter(n) generiert`
      });

    } catch (error) {
      console.error('Q&A failed:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Beantworten: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAsking(false);
      setQaQuery('');
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast({
      title: "Chat gelöscht",
      description: "Chat-Verlauf gelöscht"
    });
  };

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedWeek('');
    toast({
      title: "Filter zurückgesetzt",
      description: "Filter zurückgesetzt"
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'search' | 'qa') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (action === 'search') {
        handleSearch();
      } else {
        handleQA();
      }
    }
  };

  // Voice input handlers
  const handleSearchVoiceTranscript = (transcript: string) => {
    console.log("🎤 Search voice transcript:", transcript);
    
    if (searchQuery.trim()) {
      setSearchQuery(prev => prev + " " + transcript);
      toast({
        title: "Spracheingabe hinzugefügt",
        description: "Spracheingabe zur Suche hinzugefügt"
      });
    } else {
      setSearchQuery(transcript);
      toast({
        title: "Suchbegriff erkannt",
        description: "Suchbegriff per Sprache erfasst"
      });
    }
  };

  const handleQAVoiceTranscript = (transcript: string) => {
    console.log("🎤 Q&A voice transcript:", transcript);
    
    if (qaQuery.trim()) {
      setQaQuery(prev => prev + " " + transcript);
      toast({
        title: "Spracheingabe hinzugefügt",
        description: "Spracheingabe zur Frage hinzugefügt"
      });
    } else {
      setQaQuery(transcript);
      toast({
        title: "Frage erkannt",
        description: "Frage per Sprache erfasst"
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80">
        <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Archive className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Newsletter-Archiv Q&A System
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Durchsuchen Sie alle Newsletter-Archive und stellen Sie Fragen zu vergangenen Inhalten
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Filter Section */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Jahr filtern:
                </label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Jahre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Jahre</SelectItem>
                    {yearOptions.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Kalenderwoche filtern:
                </label>
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Wochen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle Wochen</SelectItem>
                    {weekOptions.map(week => (
                      <SelectItem key={week} value={week.toString()}>
                        KW {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
            </div>

            {(selectedYear || selectedWeek) && (
              <div className="mt-3 flex gap-2">
                {selectedYear && (
                  <Badge variant="secondary">
                    <Calendar className="h-3 w-3 mr-1" />
                    Jahr: {selectedYear}
                  </Badge>
                )}
                {selectedWeek && (
                  <Badge variant="secondary">
                    <Hash className="h-3 w-3 mr-1" />
                    KW {selectedWeek}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Tabs for Search and Q&A */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Suche
              </TabsTrigger>
              <TabsTrigger value="qa" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Q&A Chat
              </TabsTrigger>
            </TabsList>

            {/* Search Tab with Voice Input */}
            <TabsContent value="search" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Durchsuchen Sie Newsletter-Archive (z.B. 'OpenAI', 'KI-Trends', 'Machine Learning')..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'search')}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  {isSearching ? 'Suche...' : 'Suchen'}
                </Button>
                
                {/* Voice Input for Search */}
                <VoiceInput
                  onTranscript={handleSearchVoiceTranscript}
                  isDisabled={isSearching}
                  language="de-DE"
                />
              </div>

              {/* Search Results */}
              {searchResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      Suchergebnisse ({searchResults.count})
                    </h3>
                    <Badge variant="outline">
                      Suche: "{searchResults.query}"
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {searchResults.newsletters.map((newsletter) => (
                      <Card key={newsletter.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">
                              {newsletter.title}
                            </CardTitle>
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {newsletter.year}/KW{newsletter.week_number}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {newsletter.article_count} Artikel
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">
                            {newsletter.date_range}
                          </p>
                          <p className="text-sm text-gray-800 line-clamp-3">
                            {newsletter.content.substring(0, 300)}...
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Q&A Tab with Voice Input */}
            <TabsContent value="qa" className="space-y-4">
              {/* Chat History */}
              {chatHistory.length > 0 && (
                <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Chat-Verlauf</h3>
                    <Button variant="outline" size="sm" onClick={clearChat}>
                      Chat löschen
                    </Button>
                  </div>

                  {chatHistory.map((message) => (
                    <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-3 ${
                          message.role === 'user' ? 'bg-primary text-white' : 'bg-white border border-gray-200'
                        }`}>
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm max-w-none">
                              <MarkdownWithNewsletterLinks content={message.content} relatedNewsletters={message.relatedNewsletters} />
                              
                              {/* Show related newsletters */}
                              {message.relatedNewsletters && message.relatedNewsletters.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-600 mb-2">
                                    Referenzierte Newsletter:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {message.relatedNewsletters.map((nl) => (
                                      <Badge key={nl.id} variant="outline" className="text-xs">
                                        {nl.year}/KW{nl.week_number}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Q&A Input with Voice Support */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Stellen Sie eine Frage zu den Newsletter-Archiven:
                </label>
                <Textarea
                  placeholder="Z.B. 'Welche KI-Trends wurden in den letzten Monaten diskutiert?' oder nutzen Sie die Spracheingabe..."
                  value={qaQuery}
                  onChange={(e) => setQaQuery(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'qa')}
                  disabled={isAsking}
                  rows={3}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleQA} 
                    disabled={isAsking || !qaQuery.trim()}
                    className="flex-1 gap-2"
                  >
                    {isAsking ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isAsking ? 'Analysiere Archive...' : 'Frage stellen'}
                  </Button>
                  
                  {/* Voice Input for Q&A */}
                  <VoiceInput
                    onTranscript={handleQAVoiceTranscript}
                    isDisabled={isAsking}
                    language="de-DE"
                  />
                </div>

                {chatHistory.length === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <p className="text-sm text-blue-800 font-medium">
                          {isLoadingQuestions ? 'Lade aktuelle Fragevorschläge...' : 'Aktuelle Fragevorschläge:'}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={loadCurrentWeekArticlesAndGenerateQuestions}
                        disabled={isLoadingQuestions}
                        className="h-6 px-2 text-xs"
                      >
                        {isLoadingQuestions ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    
                    {isLoadingQuestions ? (
                      <div className="space-y-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-4 bg-blue-100 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {dynamicQuestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => setQaQuery(suggestion)}
                            className="block text-xs text-blue-700 hover:text-blue-900 hover:underline text-left w-full p-1 rounded hover:bg-blue-100"
                          >
                            "{suggestion}"
                          </button>
                        ))}
                        
                        {currentWeekArticles.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-xs text-blue-600 mb-1">
                              📊 Basierend auf {currentWeekArticles.length} Top-Artikeln der KW {getCurrentWeek()}/{getCurrentYear()}
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {currentWeekArticles.slice(0, 3).map((article, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                                  {article.title.substring(0, 30)}...
                                </span>
                              ))}
                            </div>
                            
                            {/* Debug Info - zeigt erkannte Keywords */}
                            {process.env.NODE_ENV === 'development' && (
                              <details className="text-xs text-blue-600">
                                <summary className="cursor-pointer">🔍 Debug: Erkannte Themen</summary>
                                <div className="mt-1 space-y-1">
                                  {(() => {
                                    const companies = new Set<string>();
                                    const technologies = new Set<string>();
                                    
                                    currentWeekArticles.forEach(article => {
                                      const title = article.title.toLowerCase();
                                      if (title.includes('openai') || title.includes('chatgpt')) companies.add('OpenAI');
                                      if (title.includes('google') || title.includes('gemini')) companies.add('Google');
                                      if (title.includes('microsoft')) companies.add('Microsoft');
                                      if (title.includes('meta')) companies.add('Meta');
                                      if (title.includes('ki') || title.includes('ai')) technologies.add('KI/AI');
                                      if (title.includes('machine learning')) technologies.add('ML');
                                    });
                                    
                                    return (
                                      <>
                                        {companies.size > 0 && (
                                          <div>🏢 Unternehmen: {Array.from(companies).join(', ')}</div>
                                        )}
                                        {technologies.size > 0 && (
                                          <div>⚡ Technologien: {Array.from(technologies).join(', ')}</div>
                                        )}
                                        <div>📅 Letztes Update: {new Date().toLocaleTimeString()}</div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </details>
                            )}
                          </div>
                        )}
                        
                        {currentWeekArticles.length === 0 && (
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                            ⚠️ Keine aktuellen Artikel verfügbar - verwende Standard-Fragen
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterArchiveQA; 