import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { ExternalLink, Trash2, ChevronDown, ChevronUp, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect, useRef } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/TranslationContext";

interface NewsCardProps {
  item: RssItem;
  isLoading?: boolean;
  onDelete?: (item: RssItem) => void;
  onTitleImproved?: (item: RssItem, newTitle: string) => void;
  selectedModel?: 'gemini' | 'mistral';
}

const NewsCard = ({ item, isLoading = false, onDelete, onTitleImproved, selectedModel = 'gemini' }: NewsCardProps) => {
  const { t, language } = useTranslation();
  const { title, link, pubDate, description, categories, sourceName, aiSummary, content } = item;
  const [isOpen, setIsOpen] = useState(false);
  const [localAiSummary, setLocalAiSummary] = useState<string | null>(aiSummary || null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);
  const [isImprovingTitle, setIsImprovingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState<string>(title);
  const [englishTitle, setEnglishTitle] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastLanguageRef = useRef<string>(language);
  const isTranslatingRef = useRef<boolean>(false);
  
  const validateImageUrl = (url?: string): boolean => {
    if (!url) return false;
    // Check for common image extensions
    return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
  };
  
  const imageUrl = validateImageUrl(item.imageUrl) ? item.imageUrl : null;

  // Verbesserte Logik für die Erkennung von eigenen Artikeln
  const isCustomArticle = 
    item.sourceName === 'Eigener' || 
    item.sourceName === 'Custom' || 
    item.sourceName === 'Eigener Import' ||
    item.sourceName === 'Custom Import' ||
    (item as any).isCustom === true ||
    item.guid?.includes('custom-') ||
    false;

  // Translate sourceName to German for display
  const getDisplaySourceName = (sourceName: string) => {
    const translations: { [key: string]: string } = {
      'Custom': 'Eigener',
      'Custom Import': 'Eigener Import',
      'Manual Import': 'Manueller Import'
    };
    return translations[sourceName] || sourceName;
  };

  // Show loading skeleton when article is being generated
  if (isLoading) {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        {Math.random() > 0.5 && (
          <div className="h-48 overflow-hidden">
            <Skeleton className="h-full w-full" />
          </div>
        )}
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
        <CardFooter className="flex flex-col space-y-3 pt-2">
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      // If the article has an guid that looks like a database ID, try to delete it from Supabase
      if (item.guid && item.guid.includes('-') && item.guid.length > 10) {
        const { error } = await supabase
          .from('daily_raw_articles')
          .delete()
          .eq('guid', item.guid);
        
        if (error) {
          console.error("Error deleting article from database:", error);
          toast.error("Fehler beim Löschen des Artikels aus der Datenbank");
          return;
        }
        
        toast.success("Artikel erfolgreich aus der Datenbank gelöscht");
      }
      
      // Call the parent's onDelete handler
      onDelete(item);
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Fehler beim Löschen des Artikels");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPreviewText = () => {
    if (localAiSummary) {
      return localAiSummary.length > 200
        ? `${localAiSummary.substring(0, 200)}...`
        : localAiSummary;
    } else if (description) {
      return description.length > 150
        ? `${description.substring(0, 150)}...`
        : description;
    }
    return null;
  };
  
  const generateAiSummary = async () => {
    if (isGeneratingAiSummary) return;
    
    setIsGeneratingAiSummary(true);
    try {
      console.log("Generating AI summary for article:", localTitle);
      console.log("Using AI provider:", selectedModel);
      console.log("Article data being sent:", {
        title: item.title,
        description: item.description?.substring(0, 100),
        content: item.content?.substring(0, 100),
        sourceName: item.sourceName
      });
      
      const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'generate-article-summary',
          data: { 
            article: {
              ...item,
              title: localTitle,
              content: item.content || item.description || '',
              description: item.description || ''
            }
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error(t('newsCard.summaryError'));
        return;
      }

      if (data.error) {
        console.error(`${selectedModel} API Error:`, data.error);
        toast.error(t('newsCard.summaryError'));
        return;
      }

      if (data.summary) {
        setLocalAiSummary(data.summary);
        toast.success(t('newsCard.summaryGenerated'));
        console.log("AI summary generated successfully:", data.summary.substring(0, 100));
      } else {
        toast.error(t('newsCard.noSummaryReceived'));
      }
    } catch (error) {
      console.error("Error generating AI summary:", error);
      toast.error(t('newsCard.summaryError'));
    } finally {
      setIsGeneratingAiSummary(false);
    }
  };

  const improveTitle = async () => {
    if (isImprovingTitle) return;
    
    setIsImprovingTitle(true);
    try {
      console.log("Improving title for article:", localTitle);
      console.log("Using AI provider:", selectedModel);
      
      const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'improve-article-title',
          data: { 
            article: {
              ...item,
              title: localTitle
            }
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error("Fehler bei der Titel-Verbesserung");
        return;
      }

      if (data.error) {
        console.error(`${selectedModel} API Error:`, data.error);
        toast.error("Fehler bei der Titel-Verbesserung");
        return;
      }

      if (data.improvedTitle) {
        // Lokalen State aktualisieren
        setLocalTitle(data.improvedTitle);
        
        // Titel dauerhaft in der Datenbank speichern
        if (item.guid) {
          console.log("Saving improved title to database for article:", item.guid);
          const { error: updateError } = await supabase
            .from('daily_raw_articles')
            .update({ 
              title: data.improvedTitle,
              updated_at: new Date().toISOString()
            })
            .eq('guid', item.guid);

          if (updateError) {
            console.error("Error saving improved title to database:", updateError);
            toast.error("Titel verbessert, aber Speicherung fehlgeschlagen");
          } else {
            console.log("✅ Improved title saved to database successfully");
            toast.success("Titel verbessert und dauerhaft gespeichert");
            
            // Parent Component über Änderung informieren
            if (onTitleImproved) {
              onTitleImproved({ ...item, title: data.improvedTitle }, data.improvedTitle);
            }
          }
        } else {
          // Fallback für Artikel ohne GUID (sollte nicht vorkommen)
          toast.success("Titel verbessert (nur für diese Sitzung)");
          if (onTitleImproved) {
            onTitleImproved(item, data.improvedTitle);
          }
        }
        
        console.log("Article title improved successfully:", data.improvedTitle);
      } else {
        toast.error("Kein verbesserter Titel erhalten");
      }
    } catch (error) {
      console.error("Error improving article title:", error);
      toast.error("Fehler bei der Titel-Verbesserung");
    } finally {
      setIsImprovingTitle(false);
    }
  };

  // Auto-translate title to English when language changes
  useEffect(() => {
    // Only react to actual language changes
    if (lastLanguageRef.current === language) return;
    
    if (isImprovingTitle || isCustomArticle || isTranslatingRef.current) return;

    console.log(`🔄 Language changed from ${lastLanguageRef.current} to ${language}`);
    lastLanguageRef.current = language;

    if (language === 'en') {
      // Switch to English: use cached translation or translate
      if (englishTitle) {
        console.log(`🌍 Using cached English title: "${englishTitle}"`);
        setLocalTitle(englishTitle);
      } else {
        // Only translate if we don't have a cached translation
        console.log(`🌍 Auto-translating title to English: "${title}"`);
        translateTitleToEnglish();
      }
    } else if (language === 'de') {
      // Switch to German: use original title
      console.log(`🇩🇪 Switching to German title: "${title}"`);
      setLocalTitle(title);
    }
  }, [language, isImprovingTitle, isCustomArticle, englishTitle, title]);

  const translateTitleToEnglish = async () => {
    if (isImprovingTitle || isTranslatingRef.current) return;
    
    isTranslatingRef.current = true;
    setIsImprovingTitle(true);
    try {
      console.log("Translating title to English:", localTitle);
      console.log("Using AI provider:", selectedModel);
      
      const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'translate-title-to-english',
          data: { 
            article: {
              ...item,
              title: localTitle
            }
          }
        }
      });

      if (error) {
        console.error("Supabase function error:", error);
        // Silently fail for auto-translation
        return;
      }

      if (data.error) {
        console.error(`${selectedModel} API Error:`, data.error);
        // Silently fail for auto-translation
        return;
      }

      if (data.translatedTitle) {
        // Cache the English translation and update local state
        setEnglishTitle(data.translatedTitle);
        setLocalTitle(data.translatedTitle);
        console.log("✅ Title auto-translated to English:", data.translatedTitle);
        
        // Don't notify parent component for auto-translations to avoid database updates
      }
    } catch (error) {
      console.error("Error translating title to English:", error);
      // Silently fail for auto-translation
    } finally {
      setIsImprovingTitle(false);
      isTranslatingRef.current = false;
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !localAiSummary) {
      generateAiSummary();
    }
  };

  return (
    <Card className={`overflow-hidden h-full flex flex-col relative ${isCustomArticle ? 'border-blue-500 bg-blue-50/50 shadow-md' : ''}`}>
      {imageUrl && (
        <div className="h-48 overflow-hidden relative">
          <img 
            src={imageUrl} 
            alt={localTitle} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.style.display = 'none';
            }}
          />
          {isCustomArticle && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant="custom" className="shadow-lg">
                Eigener Artikel
              </Badge>
            </div>
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-3 flex items-center gap-2">
              {localTitle}
              {isImprovingTitle && (
                <div title="Titel wird mit KI verbessert...">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-blue-500 hover:bg-blue-50 flex-shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  improveTitle();
                }}
                disabled={isImprovingTitle}
                title="Titel mit KI verbessern"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </CardTitle>
            {!imageUrl && isCustomArticle && (
              <div className="mt-2">
                <Badge variant="custom" className="shadow-sm">
                  Eigener Artikel
                </Badge>
              </div>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isDeleting}
                title="Artikel löschen"
              >
                {isDeleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-muted-foreground">{formatDate(pubDate)}</span>
          {sourceName && !isCustomArticle && (
            <div>
              <Badge variant="outline">{getDisplaySourceName(sourceName)}</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="flex-grow">
        <CardContent className="pb-0">
          {!isOpen && localAiSummary && (
            <div>
              <h4 className="text-sm font-medium mb-2">{t('newsCard.aiSummary')}</h4>
              <p className="text-sm line-clamp-3">{getPreviewText()}</p>
            </div>
          )}
          
          <CollapsibleTrigger asChild className="w-full">
            <Button variant="ghost" size="sm" className="w-full flex items-center justify-center text-xs mt-2">
              {isOpen ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  {t('ui.showLess')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {t('ui.showMore')}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {isGeneratingAiSummary ? (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t('newsCard.generatingSummary')}</h4>
                <div className="bg-muted/30 p-3 rounded flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <p className="text-sm">{t('ui.analysisRealContent')}</p>
                </div>
              </div>
            ) : localAiSummary ? (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2 flex justify-between">
                  <span>{t('newsCard.aiSummary')}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs" 
                    onClick={(e) => {
                      e.preventDefault();
                      generateAiSummary();
                    }}
                    disabled={isGeneratingAiSummary}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isGeneratingAiSummary ? 'animate-spin' : ''}`} />
                    {t('ui.regenerate')}
                  </Button>
                </h4>
                <div className="bg-muted/30 p-3 rounded">
                  <p className="text-sm">{localAiSummary}</p>
                </div>
              </div>
            ) : (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium mb-2">{t('newsCard.aiSummary')}</h4>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={generateAiSummary}
                  disabled={isGeneratingAiSummary}
                >
                  {isGeneratingAiSummary ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
{t('ui.analysisRealContentShort')}
                    </>
                  ) : (
                    <>
                      {t('newsCard.generateSummary')}
                    </>
                  )}
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
      
      <CardFooter className="flex flex-col space-y-3 pt-2">
        <div className="flex flex-wrap gap-1">
          {categories?.slice(0, 3).map((category, index) => (
            <Badge key={index} variant="secondary">{category}</Badge>
          ))}
        </div>
        <div className="w-full flex items-center gap-2">
          <Button 
            className="flex-1 flex items-center gap-2" 
            variant="outline"
            onClick={() => window.open(link, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
{t('newsCard.readArticle')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default NewsCard;
