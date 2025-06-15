import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import NewsService from '@/services/NewsService';

interface CustomUrlImportProps {
  onArticleAdded?: () => void;
}

export const CustomUrlImport: React.FC<CustomUrlImportProps> = ({ onArticleAdded }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Create a singleton instance
  const [newsService] = useState(() => {
    const service = new NewsService();
    return service;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Bitte geben Sie eine URL ein");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error("Bitte geben Sie eine gültige URL ein");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await newsService.processCustomUrl(url);
      
      if (result) {
        setUrl('');
        onArticleAdded?.();
        toast.success(`✅ Artikel erfolgreich importiert!`);
      } else {
        toast.error("Fehler beim Importieren des Artikels");
      }
    } catch (error) {
      console.error("Error importing URL:", error);
      toast.error(`Fehler: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Eigene URL Importieren
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="url"
            placeholder="https://beispiel.com/artikel..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isLoading ? 'Verarbeite...' : 'Importieren'}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-2">
          Importieren Sie beliebige Artikel-URLs. Diese werden durch das gleiche KI-Bewertungssystem verarbeitet und gespeichert.
        </p>
      </CardContent>
    </Card>
  );
}; 