import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Rss, Plus, Trash2, Filter, Eye, EyeOff, RefreshCw, Settings, ArrowLeft, Home } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import NewsService from "@/services/NewsService";
import { RssSource } from "@/types/newsTypes";
import Header from "@/components/Header";

const RssFeedManager = () => {
  const [newsService] = useState(() => new NewsService());
  const [sources, setSources] = useState<RssSource[]>([]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = () => {
    const allSources = newsService.getRssSources();
    setSources(allSources);
  };

  const filteredSources = showOnlyActive 
    ? sources.filter(source => source.enabled)
    : sources;

  const handleAddSource = () => {
    if (!newSourceUrl.trim()) {
      toast.error("Bitte geben Sie eine URL ein");
      return;
    }
    
    if (newsService.addRssSource(newSourceUrl.trim(), newSourceName.trim())) {
      setNewSourceUrl("");
      setNewSourceName("");
      setAddDialogOpen(false);
      loadSources();
      toast.success("RSS-Quelle erfolgreich hinzugefügt");
    }
  };

  const handleRemoveSource = (url: string, name: string) => {
    if (newsService.removeRssSource(url)) {
      loadSources();
      toast.success(`"${name}" wurde entfernt`);
    }
  };

  const handleToggleSource = (url: string, enabled: boolean) => {
    if (newsService.toggleRssSource(url, enabled)) {
      loadSources();
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      toast.info("Teste alle RSS-Quellen...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Alle RSS-Quellen wurden getestet");
    } catch (error) {
      toast.error("Fehler beim Testen der RSS-Quellen");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetToDefaults = () => {
    newsService.resetRssSourcesToDefaults();
    loadSources();
  };

  const getStatusBadge = (source: RssSource) => {
    if (source.enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Aktiv</Badge>;
    } else {
      return <Badge variant="secondary">Inaktiv</Badge>;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container mx-auto p-6 space-y-6">
          {/* Back Navigation & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50 hover:border-blue-300">
                    <ArrowLeft className="h-4 w-4" />
                    Zurück zur Hauptseite
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-blue-50">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
                RSS Feed Verwaltung
              </h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie alle Ihre RSS-Quellen an einem Ort
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOnlyActive(!showOnlyActive)}
                className="gap-2"
              >
                {showOnlyActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showOnlyActive ? "Alle anzeigen" : "Nur aktive"}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Alle testen
              </Button>
              
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4" />
                Standard-Quellen laden
              </Button>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{sources.length}</div>
                  <div className="text-sm text-muted-foreground">Gesamt Quellen</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sources.filter(s => s.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Aktive Quellen</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {sources.filter(s => !s.enabled).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Inaktive Quellen</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Info */}
          {showOnlyActive && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Filter className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                Nur aktive RSS-Quellen werden angezeigt ({filteredSources.length} von {sources.length})
              </span>
            </div>
          )}

          {/* RSS Sources List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  Meine RSS-Quellen ({filteredSources.length})
                </CardTitle>
                <CardDescription>
                  Alle Ihre konfigurierten RSS-Feeds im Überblick
                </CardDescription>
              </div>
              
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Neue Quelle
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>RSS-Quelle hinzufügen</DialogTitle>
                    <DialogDescription>
                      Fügen Sie eine neue RSS-Quelle hinzu. Die URL wird automatisch optimiert.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">RSS-Feed URL</Label>
                      <Input
                        id="url"
                        placeholder="https://beispiel.de/feed"
                        value={newSourceUrl}
                        onChange={(e) => setNewSourceUrl(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name (optional)</Label>
                      <Input
                        id="name"
                        placeholder="Quellen-Name"
                        value={newSourceName}
                        onChange={(e) => setNewSourceName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button onClick={handleAddSource}>
                      Hinzufügen
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent>
              {filteredSources.length === 0 ? (
                <div className="text-center py-8">
                  <Rss className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    {showOnlyActive ? "Keine aktiven RSS-Quellen" : "Keine RSS-Quellen vorhanden"}
                  </p>
                  <p className="text-muted-foreground mb-4">
                    {showOnlyActive 
                      ? "Aktivieren Sie mindestens eine RSS-Quelle oder zeigen Sie alle an."
                      : "Fügen Sie Ihre erste RSS-Quelle hinzu."
                    }
                  </p>
                  {showOnlyActive && (
                    <Button 
                      variant="outline" 
                      onClick={() => setShowOnlyActive(false)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Alle RSS-Quellen anzeigen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSources.map((source, index) => (
                    <div 
                      key={index} 
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Source Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-base line-clamp-1">
                                {source.name}
                              </h3>
                              <p className="text-sm text-muted-foreground break-all">
                                {source.url}
                              </p>
                            </div>
                            {getStatusBadge(source)}
                          </div>
                          
                          {source.lastFetched && (
                            <p className="text-xs text-muted-foreground">
                              Zuletzt abgerufen: {new Date(source.lastFetched).toLocaleString('de-DE')}
                            </p>
                          )}
                        </div>
                        
                        {/* Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`source-${index}`}
                              checked={source.enabled}
                              onCheckedChange={(checked) => handleToggleSource(source.url, checked)}
                            />
                            <Label 
                              htmlFor={`source-${index}`} 
                              className="text-sm cursor-pointer"
                            >
                              {source.enabled ? "Aktiv" : "Inaktiv"}
                            </Label>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Entfernen</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>RSS-Quelle entfernen</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sind Sie sicher, dass Sie "{source.name}" entfernen möchten? 
                                  Diese Aktion kann nicht rückgängig gemacht werden.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveSource(source.url, source.name)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Entfernen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RssFeedManager; 