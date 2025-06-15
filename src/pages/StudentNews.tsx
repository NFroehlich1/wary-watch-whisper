import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, GraduationCap, BookOpen, ArrowLeft } from "lucide-react";
import NewsService, { RssItem } from "@/services/NewsService";
import { getCurrentWeek, getCurrentYear } from "@/utils/dateUtils";
import Header from "@/components/Header";
import NewsCard from "@/components/NewsCard";
import { Link } from "react-router-dom";
import { useTranslation } from "@/contexts/TranslationContext";

const StudentNews = () => {
  const { t } = useTranslation();
  const [newsService] = useState(new NewsService());
  const [relevantArticles, setRelevantArticles] = useState<RssItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchStudentRelevantNews();
  }, []);

  const fetchStudentRelevantNews = async () => {
    setIsLoading(true);
    try {
      console.log("=== FETCHING STUDENT RELEVANT NEWS ===");
      
      // Get all current week articles - SAME as main page
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

      // Filter for current week - SAME as main page
      const currentWeekItems = newsService.filterCurrentWeekNews(allItems);
      
      // Use the SAME ranking logic as the main page, but still filter for students
      const rankedArticles = currentWeekItems
        .map(article => ({
          ...article,
          relevanceScore: calculateRelevanceScore(article)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Filter for student-relevant content from the already ranked articles
      const studentRelevantItems = rankedArticles.filter(article => 
        filterStudentRelevantArticles([article]).length > 0
      );
      
      // Take top 10 from the student-relevant articles
      const topRelevantArticles = studentRelevantItems.slice(0, 10);
      
      setRelevantArticles(topRelevantArticles);
      console.log(`✅ Found ${topRelevantArticles.length} student-relevant articles from ${rankedArticles.length} total articles`);
      console.log("Student articles ranking matches main page ranking now");
      
    } catch (error) {
      console.error('Error fetching student relevant news:', error);
      toast.error(`${t('toast.student_news_error')} ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudentRelevantArticles = (articles: RssItem[]): RssItem[] => {
    const studentKeywords = [
      // Technologie & KI
      'künstliche intelligenz', 'ki', 'ai', 'machine learning', 'deep learning',
      'technologie', 'innovation', 'startup', 'tech', 'digital',
      // Bildung & Karriere
      'student', 'studium', 'universität', 'hochschule', 'bildung', 'karriere',
      'praktikum', 'job', 'ausbildung', 'lernen', 'weiterbildung',
      // Programmierung & IT
      'programmierung', 'coding', 'software', 'entwicklung', 'web', 'app',
      'python', 'javascript', 'react', 'github', 'open source',
      // Zukunft & Trends
      'zukunft', 'trend', 'forschung', 'wissenschaft', 'digitalisierung',
      'nachhaltigkeit', 'fintech', 'blockchain', 'kryptowährung',
      // Wirtschaft & Business
      'wirtschaft', 'business', 'unternehmen', 'management', 'marketing',
      'e-commerce', 'online', 'social media', 'platform'
    ];

    return articles.filter(article => {
      const searchText = `${article.title} ${article.description || ''} ${(article.categories || []).join(' ')}`.toLowerCase();
      
      // Check if any student keyword is present
      const hasStudentKeyword = studentKeywords.some(keyword => 
        searchText.includes(keyword.toLowerCase())
      );
      
      // Additional filters for relevance
      const isFromTechSource = article.sourceName && [
        'TechCrunch', 'Wired', 'Ars Technica', 'The Verge', 'MIT Technology Review',
        'Golem', 'Heise', 't3n', 'Gründerszene'
      ].some(source => article.sourceName?.includes(source));
      
      return hasStudentKeyword || isFromTechSource;
    });
  };

  const calculateRelevanceScore = (article: RssItem): number => {
    let score = 0;
    
    // Use the SAME ranking logic as WeeklyDigest and ArticleRanking
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
    
    // Additional bonus for student-relevant content
    const studentKeywords = ['student', 'studium', 'programmierung', 'karriere', 'job', 'bildung'];
    studentKeywords.forEach(keyword => {
      if (titleLower.includes(keyword.toLowerCase()) || descLower.includes(keyword.toLowerCase())) {
        score += 1; // Small bonus for student relevance
      }
    });
    
    return Math.max(score, 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
{t('student.back')}
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                {t('student.title')}
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('student.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-gray-500">
                {t('main.week')} {getCurrentWeek()}/{getCurrentYear()} • {t('main.automatically_updated')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">{t('student.most_relevant')}</h2>
            <Badge variant="custom">{relevantArticles.length} {t('student.articles')}</Badge>
          </div>
          
          <Button 
            onClick={fetchStudentRelevantNews} 
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t('student.updating')}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('student.refresh')}
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden h-full flex flex-col">
                <CardHeader>
                  <Skeleton className="h-6 w-full mb-2" />
                  <div className="flex items-center justify-between mt-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : relevantArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {relevantArticles.map((article, index) => (
                <div key={article.guid || article.link} className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge variant="custom" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  <NewsCard 
                    item={article}
                    isLoading={false}
                  />
                </div>
              ))}
            </div>
            
            <Card className="bg-blue-50/50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  {t('student.selection_criteria')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">{t('student.relevance_filter')}</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>{t('student.ai_tech_topics')}</li>
                      <li>{t('student.programming_software')}</li>
                      <li>{t('student.career_education')}</li>
                      <li>{t('student.startup_innovation')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">{t('student.evaluation_criteria')}</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>{t('student.news_timeliness')}</li>
                      <li>{t('student.student_keywords')}</li>
                      <li>{t('student.trusted_sources')}</li>
                      <li>{t('student.practical_application')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('student.no_articles_found')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('student.no_articles_desc')}
              </p>
              <Button 
                onClick={fetchStudentRelevantNews} 
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('main.try_again')}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default StudentNews;
