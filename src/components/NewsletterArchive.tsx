
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, RefreshCw, Trash2, Archive, Eye } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import NewsletterArchiveService, { NewsletterArchiveEntry } from "@/services/NewsletterArchiveService";

const NewsletterArchive = () => {
  const [newsletters, setNewsletters] = useState<NewsletterArchiveEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterArchiveEntry | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const archiveService = new NewsletterArchiveService();

  useEffect(() => {
    loadNewsletters();
  }, []);

  const loadNewsletters = async () => {
    setIsLoading(true);
    try {
      const data = await archiveService.getNewsletters();
      setNewsletters(data);
      
      if (data.length === 0) {
        toast.info("Keine Newsletter im Archiv gefunden.");
      }
    } catch (error) {
      console.error("Fehler beim Laden der Newsletter:", error);
      toast.error("Newsletter konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNewsletter = async (id: string) => {
    const success = await archiveService.deleteNewsletter(id);
    if (success) {
      await loadNewsletters();
      if (selectedNewsletter?.id === id) {
        setSelectedNewsletter(null);
      }
    }
  };

  const totalPages = Math.ceil(newsletters.length / itemsPerPage);
  const paginatedNewsletters = newsletters.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5" />
                Newsletter-Archiv
              </CardTitle>
              <CardDescription>
                Gespeicherte Newsletter anzeigen und verwalten
              </CardDescription>
            </div>
            <Button 
              onClick={loadNewsletters} 
              variant="outline" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Newsletter werden geladen...</p>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-8">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Keine Newsletter im Archiv gefunden.</p>
              <p className="text-muted-foreground text-sm mt-2">
                Newsletter werden automatisch beim Generieren gespeichert.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titel</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Artikel</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNewsletters.map((newsletter) => (
                    <TableRow key={newsletter.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{newsletter.title}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {newsletter.date_range}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(newsletter.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {newsletter.article_count} Artikel
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedNewsletter(newsletter)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Anzeigen
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle>{newsletter.title}</DialogTitle>
                              </DialogHeader>
                              <Tabs defaultValue="markdown" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                                  <TabsTrigger value="preview">Vorschau</TabsTrigger>
                                </TabsList>
                                <TabsContent value="markdown" className="mt-4">
                                  <div className="max-h-[60vh] overflow-y-auto">
                                    <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                                      {newsletter.content}
                                    </pre>
                                  </div>
                                </TabsContent>
                                <TabsContent value="preview" className="mt-4">
                                  <div className="max-h-[60vh] overflow-y-auto prose prose-sm max-w-none">
                                    <ReactMarkdown
                                      components={{
                                        h1: ({ children }) => <h1 className="text-2xl font-bold text-primary mb-4 border-b border-gray-200 pb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">{children}</h3>,
                                        p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-gray-700">{children}</ul>,
                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        a: ({ href, children }) => (
                                          <a 
                                            href={href} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 font-medium"
                                          >
                                            {children}
                                          </a>
                                        ),
                                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                                        em: ({ children }) => <em className="italic text-gray-800">{children}</em>
                                      }}
                                    >
                                      {newsletter.content}
                                    </ReactMarkdown>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => deleteNewsletter(newsletter.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={page === i + 1}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterArchive;
