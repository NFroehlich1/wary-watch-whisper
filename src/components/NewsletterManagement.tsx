import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Send, Mail, User, Pencil, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import NewsletterArchiveService, { NewsletterArchiveEntry } from "@/services/NewsletterArchiveService";
import { getCurrentWeek, getCurrentYear } from "@/utils/dateUtils";
import { useTranslation } from "@/contexts/TranslationContext";

// Define a type for the newsletter
type Newsletter = {
  subject: string;
  content: string;
  sender_name: string;
  sender_email: string;
  sent_at: string;
  recipients_count: number;
}

const NewsletterManagement = () => {
  const { t } = useTranslation();
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Newsletter content and sender details
  const [subject, setSubject] = useState<string>(`KI-Newsletter vom ${new Date().toLocaleDateString('de-DE')}`);
  const [senderName, setSenderName] = useState<string>("KI-Newsletter");
  const [senderEmail, setSenderEmail] = useState<string>("newsletter@decoderproject.com");
  const [activeTab, setActiveTab] = useState("basic");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  
  // Archive-related state
  const [archivedNewsletters, setArchivedNewsletters] = useState<NewsletterArchiveEntry[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>("");
  const [newsletterContent, setNewsletterContent] = useState<string>("");
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  const archiveService = new NewsletterArchiveService();

  useEffect(() => {
    loadArchivedNewsletters();
  }, []);

  const loadArchivedNewsletters = async () => {
    setIsLoadingArchive(true);
    try {
      const newsletters = await archiveService.getNewsletters();
      setArchivedNewsletters(newsletters);
      
      // Try to find and pre-select current week's newsletter
      const currentWeek = getCurrentWeek();
      const currentYear = getCurrentYear();
      
      const currentWeekNewsletter = newsletters.find(
        n => n.week_number === currentWeek && n.year === currentYear
      );
      
      if (currentWeekNewsletter) {
        setSelectedArchiveId(currentWeekNewsletter.id);
        setNewsletterContent(currentWeekNewsletter.content);
        setSubject(`LINKIT WEEKLY - KW ${currentWeek}/${currentYear}`);
        console.log(`✅ Pre-selected current week newsletter: KW ${currentWeek}/${currentYear}`);
      } else {
        console.log(`📅 No newsletter found for current week: KW ${currentWeek}/${currentYear}`);
      }
    } catch (error) {
      console.error("Fehler beim Laden der archivierten Newsletter:", error);
      toast.error("Newsletter-Archiv konnte nicht geladen werden.");
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const handleArchiveSelection = (archiveId: string) => {
    const selectedNewsletter = archivedNewsletters.find(n => n.id === archiveId);
    if (selectedNewsletter) {
      setSelectedArchiveId(archiveId);
      setNewsletterContent(selectedNewsletter.content);
      setSubject(selectedNewsletter.title);
      console.log(`📰 Selected newsletter: ${selectedNewsletter.title}`);
    }
  };

  const loadSubscriberCount = async () => {
    setIsLoadingSubscribers(true);
    try {
      const { count, error } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true })
        .eq("confirmed", true);
      
      if (error) throw error;
      setSubscriberCount(count);
    } catch (error) {
      console.error("Fehler beim Laden der Abonnenten:", error);
      toast.error("Abonnenten konnten nicht geladen werden.");
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const generatePreview = () => {
    if (newsletterContent) {
      console.log("✅ Generating preview with markdown content");
      setPreviewHtml(newsletterContent);
    } else {
      setPreviewHtml("");
    }
    setActiveTab("preview");
  };

  const handleSendNewsletter = async () => {
    if (!newsletterContent) {
      toast.error("Bitte wählen Sie einen Newsletter-Inhalt aus dem Archiv aus.");
      return;
    }

    setIsSending(true);
    try {
      // Prepare data to send
      const newsletterData = {
        subject,
        senderName,
        senderEmail,
        customContent: newsletterContent
      };

      const response = await supabase.functions.invoke("newsletter-send", {
        body: newsletterData
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const data = response.data;
      
      if (data.success) {
        toast.success(`Newsletter wurde an ${data.emailsSent} Abonnenten verarbeitet!`);
      } else {
        throw new Error(data.message || "Unbekannter Fehler");
      }
    } catch (error: any) {
      console.error("Fehler beim Versenden des Newsletters:", error);
      toast.error("Newsletter konnte nicht versendet werden: " + (error.message || "Unbekannter Fehler"));
    } finally {
      setIsSending(false);
    }
  };

  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('admin.newsletterManagement')}</CardTitle>
        <CardDescription>
          {t('admin.manageSettings')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="basic">{t('admin.basicSettings')}</TabsTrigger>
            <TabsTrigger value="content">{t('admin.newsletterSelection')}</TabsTrigger>
            <TabsTrigger value="preview">{t('admin.preview')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscriber-count">{t('admin.subscribers')}</Label>
              <div className="flex gap-2">
                <Input
                  id="subscriber-count"
                  value={subscriberCount !== null ? `${subscriberCount} ${t('admin.confirmedSubscribers')}` : t('admin.clickLoad')}
                  readOnly
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={loadSubscriberCount} 
                  disabled={isLoadingSubscribers}
                >
                  {isLoadingSubscribers ? t('admin.loading') : t('admin.load')}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="schedule-date">{t('admin.sendTime')}</Label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schedule-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sender-name">{t('admin.senderName')}</Label>
              <div className="flex-1 relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sender-name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="pl-9"
                  placeholder="KI-Newsletter"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sender-email">{t('admin.senderEmail')}</Label>
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sender-email"
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="pl-9"
                  placeholder="newsletter@example.com"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">{t('admin.newsletterSubject')}</Label>
              <div className="flex-1 relative">
                <Pencil className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="pl-9"
                  placeholder="LINKIT WEEKLY - KW XX/YYYY"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="archive-selection">{t('admin.selectFromArchive')}</Label>
              <div className="flex-1 relative">
                <Archive className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Select value={selectedArchiveId} onValueChange={handleArchiveSelection}>
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder={isLoadingArchive ? t('admin.loadingArchive') : t('admin.selectNewsletter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {archivedNewsletters.map((newsletter) => (
                      <SelectItem key={newsletter.id} value={newsletter.id}>
                        {newsletter.title} ({newsletter.date_range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {newsletterContent && (
              <div className="space-y-2">
                <Label htmlFor="newsletter-content">{t('admin.selectedContent')}</Label>
                <Textarea
                  id="newsletter-content"
                  value={newsletterContent}
                  onChange={(e) => setNewsletterContent(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder={t('admin.contentPlaceholder')}
                />
              </div>
            )}
            
            <Button
              onClick={generatePreview}
              variant="outline"
              className="w-full mt-4"
              disabled={!newsletterContent}
            >
              {t('admin.generatePreview')}
            </Button>
          </TabsContent>
          
          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-medium mb-2">{subject}</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  {t('admin.from')} {senderName} &lt;{senderEmail}&gt;
                </div>
                <div className="newsletter-preview bg-white p-6 rounded-md border">
                  {previewHtml ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          h1: ({children}) => <h1 className="text-2xl font-bold mb-4 text-gray-900">{children}</h1>,
                          h2: ({children}) => <h2 className="text-xl font-semibold mb-3 mt-6 text-gray-800">{children}</h2>,
                          h3: ({children}) => <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700">{children}</h3>,
                          p: ({children}) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                          a: ({children, href}) => (
                            <a 
                              href={href} 
                              className="text-blue-600 hover:text-blue-800 underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                          ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="text-gray-600">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                          em: ({children}) => <em className="italic text-gray-700">{children}</em>,
                          blockquote: ({children}) => (
                            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {previewHtml}
                      </ReactMarkdown>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          {t('admin.subscribeReceived')} 
                          <a href="#" className="text-gray-500 hover:text-gray-700 underline ml-1">
                            {t('admin.unsubscribeHere')}
                          </a>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      {t('admin.selectNewsletterAndGenerate')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSendNewsletter}
          disabled={isSending || !newsletterContent}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSending ? t('admin.sendingNewsletter') : t('admin.sendNewsletterNow')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default NewsletterManagement;
