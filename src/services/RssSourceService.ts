import { RssSource } from '../types/newsTypes';
import { DEFAULT_RSS_SOURCES } from '../data/mockNews';
import { toast } from "sonner";

/**
 * Service for managing RSS sources - supports any valid RSS feed
 */
class RssSourceService {
  private rssSources: RssSource[] = [];
  
  constructor() {
    this.loadRssSources();
  }
  
  // Load RSS sources from localStorage
  private loadRssSources(): void {
    try {
      const savedSources = localStorage.getItem('rss_sources');
      
      // Wenn keine Quellen gespeichert sind, alle Standard-Quellen laden
      if (!savedSources) {
        this.rssSources = [...DEFAULT_RSS_SOURCES];
        this.saveRssSources();
        console.log(`✅ ${DEFAULT_RSS_SOURCES.length} Standard RSS-Quellen initialisiert`);
      } else {
        const parsedSources = JSON.parse(savedSources);
        
        // Update existing sources to use correct feed URLs
        this.rssSources = parsedSources.map((source: RssSource) => {
          if (source.url.includes('the-decoder.de') && !source.url.includes('/feed/')) {
            return {
              ...source,
              url: "https://the-decoder.de/feed/"
            };
          }
          return source;
        });
        
        // If no valid sources found, add all defaults
        if (this.rssSources.length === 0) {
          this.rssSources = [...DEFAULT_RSS_SOURCES];
        }
        
        this.saveRssSources();
      }
    } catch (error) {
      console.error("Error loading RSS sources:", error);
      this.rssSources = [...DEFAULT_RSS_SOURCES];
      this.saveRssSources();
    }
  }
  
  // Save RSS sources to localStorage
  private saveRssSources(): void {
    try {
      localStorage.setItem('rss_sources', JSON.stringify(this.rssSources));
    } catch (error) {
      console.error("Error saving RSS sources:", error);
      toast.error("Fehler beim Speichern der RSS-Quellen");
    }
  }
  
  // Reset to default RSS sources
  public resetToDefaults(): void {
    this.rssSources = [...DEFAULT_RSS_SOURCES];
    this.saveRssSources();
    console.log(`✅ RSS-Quellen auf ${DEFAULT_RSS_SOURCES.length} Standard-Quellen zurückgesetzt`);
    toast.success(`RSS-Quellen zurückgesetzt - ${DEFAULT_RSS_SOURCES.length} Quellen geladen`);
  }

  // Get all RSS sources
  public getRssSources(): RssSource[] {
    return [...this.rssSources];
  }
  
  // Get only enabled RSS sources
  public getEnabledRssSources(): RssSource[] {
    return this.rssSources.filter(source => source.enabled);
  }
  
  // Add a new RSS source - now allows any valid RSS feed URL
  public addRssSource(url: string, name: string): boolean {
    // Basic URL validation
    try {
      new URL(url);
    } catch (error) {
      toast.error("Ungültige URL");
      return false;
    }
    
    // Smart RSS URL detection and correction
    let feedUrl = this.normalizeRssUrl(url);
    
    // Check if source already exists
    if (this.rssSources.some(source => source.url === feedUrl)) {
      toast.error("Diese RSS-Quelle existiert bereits");
      return false;
    }
    
    // Generate a default name if none provided
    const sourceName = name.trim() || this.generateSourceName(feedUrl);
    
    this.rssSources.push({
      url: feedUrl,
      name: sourceName,
      enabled: true
    });
    
    this.saveRssSources();
    toast.success(`Neue RSS-Quelle "${sourceName}" hinzugefügt`);
    return true;
  }

  // Normalize RSS URL - add common RSS paths if needed
  private normalizeRssUrl(url: string): string {
    let feedUrl = url.trim();
    
    // Remove trailing slash for processing
    const baseUrl = feedUrl.replace(/\/$/, '');
    
    // If URL already contains common RSS paths, return as is
    const rssPatterns = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml'];
    if (rssPatterns.some(pattern => feedUrl.includes(pattern))) {
      return feedUrl;
    }
    
    // For known domains, add the correct RSS path
    if (baseUrl.includes('the-decoder.de')) {
      return baseUrl + '/feed/';
    } else if (baseUrl.includes('techcrunch.com')) {
      return baseUrl + '/feed/';
    } else if (baseUrl.includes('wired.com')) {
      return baseUrl + '/feed/rss';
    } else if (baseUrl.includes('oreilly.com')) {
      return 'https://feeds.feedburner.com/oreilly/radar';
    } else if (baseUrl.includes('heise.de')) {
      return baseUrl + '/rss/news-atom.xml';
    } else if (baseUrl.includes('golem.de')) {
      return baseUrl + '/rss.php';
    } else if (baseUrl.includes('t3n.de')) {
      return baseUrl + '/feed/';
    } else if (baseUrl.includes('stackoverflow.com') && baseUrl.includes('/questions/tagged/')) {
      return baseUrl + '?tab=newest&sort=newest&pagesize=50';
    }
    
    // For unknown domains, try common RSS paths
    // First try /feed/ (most common)
    return baseUrl + '/feed/';
  }

  // Generate a default source name from URL
  private generateSourceName(url: string): string {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      
      // Known domain names
      const knownDomains: { [key: string]: string } = {
        'the-decoder.de': 'The Decoder',
        'techcrunch.com': 'TechCrunch',
        'wired.com': 'Wired',
        'oreilly.com': 'O\'Reilly Radar',
        'heise.de': 'Heise Online',
        'golem.de': 'Golem.de',
        't3n.de': 't3n Magazine',
        'stackoverflow.com': 'Stack Overflow',
        'reddit.com': 'Reddit',
        'medium.com': 'Medium',
        'dev.to': 'DEV Community'
      };
      
      // Check for known domains
      for (const [domainKey, displayName] of Object.entries(knownDomains)) {
        if (domain.includes(domainKey)) {
          return displayName;
        }
      }
      
      // Generate name from domain
      return domain.split('.')[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
        
    } catch (error) {
      return "Unbekannte Quelle";
    }
  }
  
  // Remove an RSS source
  public removeRssSource(url: string): boolean {
    const initialLength = this.rssSources.length;
    this.rssSources = this.rssSources.filter(source => source.url !== url);
    
    if (this.rssSources.length < initialLength) {
      this.saveRssSources();
      toast.success("RSS-Quelle entfernt");
      return true;
    }
    
    return false;
  }
  
  // Toggle RSS source enabled/disabled state
  public toggleRssSource(url: string, enabled: boolean): boolean {
    const source = this.rssSources.find(source => source.url === url);
    if (source) {
      source.enabled = enabled;
      this.saveRssSources();
      toast.success(`RSS-Quelle ${enabled ? 'aktiviert' : 'deaktiviert'}`);
      return true;
    }
    return false;
  }
  
  // Check if any sources are enabled
  public hasEnabledSources(): boolean {
    return this.rssSources.some(source => source.enabled);
  }
  
  // Get source by URL
  public getSourceByUrl(url: string): RssSource | undefined {
    return this.rssSources.find(source => source.url === url);
  }
  
  // Filter sources by name (partial match)
  public filterSourcesByName(name: string): RssSource[] {
    const lowerCaseName = name.toLowerCase();
    return this.rssSources.filter(
      source => source.name.toLowerCase().includes(lowerCaseName)
    );
  }
}

export default RssSourceService;
