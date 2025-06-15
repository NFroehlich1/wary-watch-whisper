import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { parseString } from "npm:xml2js@0.6.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL ist erforderlich');
    }

    console.log(`Fetching RSS from: ${url}`);

    // Determine the correct RSS feed URL
    let rssUrl = normalizeRssUrl(url);

    console.log(`Using RSS URL: ${rssUrl}`);

    // Fetch RSS feed with proper headers
    const rssResponse = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader)',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
      },
    });

    if (!rssResponse.ok) {
      throw new Error(`RSS fetch failed: ${rssResponse.status} ${rssResponse.statusText}`);
    }

    const rssText = await rssResponse.text();
    
    if (!rssText || rssText.trim().length === 0) {
      throw new Error('Leere RSS-Antwort erhalten');
    }

    console.log(`RSS content length: ${rssText.length} characters`);

    // Clean the RSS text to handle invalid XML characters
    const cleanedRssText = cleanXmlText(rssText);
    console.log(`Cleaned RSS content, length: ${cleanedRssText.length} characters`);

    // Parse XML to JSON
    const parsedData = await new Promise((resolve, reject) => {
      parseString(cleanedRssText, { 
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
        sanitize: true,
        normalize: true
      }, (err: any, result: any) => {
        if (err) {
          console.error('XML parse error:', err);
          reject(err);
        } else {
          resolve(result);
        }
      });
    });

    // Extract articles from parsed data
    const articles = extractArticles(parsedData as any, rssUrl);
    
    console.log(`Successfully parsed ${articles.length} articles from ${rssUrl}`);

    return new Response(JSON.stringify({ 
      success: true,
      articles,
      source_url: rssUrl,
      source_name: getSourceName(rssUrl)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-rss function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        articles: [] // Return empty array on error
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function cleanXmlText(xmlText: string): string {
  try {
    // Remove invalid XML characters that commonly cause parsing issues
    return xmlText
      // Remove null bytes and other control characters except tab, newline, carriage return
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Fix common HTML entities that might not be properly encoded
      .replace(/&(?!(?:amp|lt|gt|quot|apos|#x?[0-9a-fA-F]+);)/g, '&amp;')
      // Remove or fix invalid entity names
      .replace(/&([^;\s]+);/g, (match, entity) => {
        // Keep valid HTML entities
        const validEntities = ['amp', 'lt', 'gt', 'quot', 'apos', 'nbsp', 'copy', 'reg'];
        if (validEntities.includes(entity.toLowerCase()) || /^#x?[0-9a-f]+$/i.test(entity)) {
          return match;
        }
        // Replace invalid entities with their literal text
        return `&amp;${entity};`;
      });
  } catch (error) {
    console.error('Error cleaning XML text:', error);
    return xmlText; // Return original if cleaning fails
  }
}

function extractArticles(data: any, sourceUrl: string): any[] {
  const articles: any[] = [];
  
  try {
    // Handle different RSS/Atom formats
    let items: any[] = [];
    
    if (data.rss && data.rss.channel && data.rss.channel.item) {
      // RSS 2.0 format
      items = Array.isArray(data.rss.channel.item) ? data.rss.channel.item : [data.rss.channel.item];
    } else if (data.feed && data.feed.entry) {
      // Atom format
      items = Array.isArray(data.feed.entry) ? data.feed.entry : [data.feed.entry];
    } else if (data.channel && data.channel.item) {
      // Direct channel format
      items = Array.isArray(data.channel.item) ? data.channel.item : [data.channel.item];
    }

    console.log(`Found ${items.length} raw items in feed`);

    for (const item of items) {
      try {
        const article = {
          title: extractText(item.title) || 'Ohne Titel',
          link: extractText(item.link) || extractText(item.guid) || '#',
          description: extractText(item.description) || extractText(item.summary) || extractText(item.content) || '',
          pubDate: extractDate(item.pubDate || item.published || item.date) || new Date().toISOString(),
          guid: extractText(item.guid) || extractText(item.id) || extractText(item.link) || `article-${Date.now()}-${Math.random()}`,
          creator: extractText(item.author) || extractText(item.creator) || 'Unbekannter Autor',
          categories: extractCategories(item.category),
          content: extractText(item.content) || extractText(item.description) || '',
          imageUrl: extractImageUrl(item),
          sourceName: getSourceName(sourceUrl)
        };

        // Only add articles with meaningful content
        if (article.title !== 'Ohne Titel' || article.description.length > 0) {
          articles.push(article);
        }
      } catch (itemError) {
        console.error('Error processing individual item:', itemError);
        // Continue with next item
      }
    }

    console.log(`Successfully processed ${articles.length} valid articles`);
    
  } catch (error) {
    console.error('Error extracting articles:', error);
  }

  return articles;
}

function extractText(value: any): string {
  if (!value) return '';
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  if (typeof value === 'object') {
    if (value._) return value._.trim();
    if (value.$t) return value.$t.trim();
    if (value.content) return value.content.trim();
    if (typeof value.toString === 'function') return value.toString().trim();
  }
  
  return String(value).trim();
}

function extractDate(value: any): string {
  if (!value) return new Date().toISOString();
  
  const dateStr = extractText(value);
  if (!dateStr) return new Date().toISOString();
  
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractCategories(value: any): string[] {
  if (!value) return [];
  
  if (Array.isArray(value)) {
    return value.map(cat => extractText(cat)).filter(Boolean);
  }
  
  const category = extractText(value);
  return category ? [category] : [];
}

function extractImageUrl(item: any): string {
  // Try various image fields
  if (item.enclosure && item.enclosure.$ && item.enclosure.$.url) {
    const type = item.enclosure.$.type || '';
    if (type.includes('image')) {
      return item.enclosure.$.url;
    }
  }
  
  if (item['media:thumbnail'] && item['media:thumbnail'].$.url) {
    return item['media:thumbnail'].$.url;
  }
  
  if (item['media:content'] && item['media:content'].$.url) {
    const type = item['media:content'].$.type || '';
    if (type.includes('image')) {
      return item['media:content'].$.url;
    }
  }
  
  // Fallback to placeholder
  return `https://picsum.photos/800/600?random=${Math.floor(Math.random() * 1000)}`;
}

// Normalize RSS URL - add common RSS paths if needed
function normalizeRssUrl(url: string): string {
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
  } else if (baseUrl.includes('dev.to')) {
    return baseUrl + '/feed';
  } else if (baseUrl.includes('medium.com')) {
    return baseUrl + '/feed';
  } else if (baseUrl.includes('reddit.com') && baseUrl.includes('/r/')) {
    return baseUrl + '.rss';
  }
  
  // For unknown domains, try common RSS paths
  // First try /feed/ (most common)
  return baseUrl + '/feed/';
}

function getSourceName(url: string): string {
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
      'dev.to': 'DEV Community',
      'hackernews.com': 'Hacker News',
      'news.ycombinator.com': 'Hacker News'
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
      
  } catch {
    return 'Unbekannte Quelle';
  }
}
