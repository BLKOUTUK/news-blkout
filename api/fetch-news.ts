/**
 * News Fetch API Endpoint
 *
 * GET /api/fetch-news?preview=true - Preview what would be fetched
 * POST /api/fetch-news - Actually fetch and insert news (requires auth)
 */

import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// ============== NEWS SOURCES ==============

interface NewsSource {
  name: string;
  url: string;
  feedUrl?: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  region: string;
  active: boolean;
}

const RSS_SOURCES: NewsSource[] = [
  // ── UK LGBTQ+ News ──
  { name: 'PinkNews', url: 'https://www.pinknews.co.uk', feedUrl: 'https://www.thepinknews.com/feed/', category: 'community', priority: 'high', tags: ['lgbtq', 'uk', 'news'], region: 'uk', active: true },
  { name: 'Attitude', url: 'https://www.attitude.co.uk', feedUrl: 'https://www.attitude.co.uk/feed/', category: 'culture', priority: 'high', tags: ['lgbtq', 'uk', 'culture'], region: 'uk', active: true },
  { name: 'Gay Times', url: 'https://www.gaytimes.co.uk', feedUrl: 'https://www.gaytimes.co.uk/feed/', category: 'community', priority: 'high', tags: ['lgbtq', 'uk', 'news'], region: 'uk', active: true },
  { name: 'DIVA Magazine', url: 'https://divamag.co.uk', feedUrl: 'https://divamag.co.uk/feed/', category: 'culture', priority: 'medium', tags: ['lgbtq', 'uk', 'women', 'lesbian'], region: 'uk', active: true },
  { name: 'Guardian LGBTQ+', url: 'https://www.theguardian.com/world/lgbt-rights', feedUrl: 'https://www.theguardian.com/world/lgbt-rights/rss', category: 'politics', priority: 'high', tags: ['lgbtq', 'uk', 'rights', 'news'], region: 'uk', active: true },

  // ── UK Black Media ──
  { name: 'The Voice', url: 'https://www.voice-online.co.uk', feedUrl: 'https://www.voice-online.co.uk/feed/', category: 'community', priority: 'high', tags: ['black', 'uk', 'news', 'community'], region: 'uk', active: true },
  { name: 'Black Ballad', url: 'https://blackballad.co.uk', feedUrl: 'https://blackballad.co.uk/feed/', category: 'culture', priority: 'high', tags: ['black', 'women', 'uk', 'culture'], region: 'uk', active: true },
  { name: 'gal-dem', url: 'https://gal-dem.com', feedUrl: 'https://gal-dem.com/feed/', category: 'culture', priority: 'high', tags: ['black', 'women', 'uk', 'culture', 'lgbtq'], region: 'uk', active: true },

  // ── UK Orgs ──
  { name: 'Terrence Higgins Trust', url: 'https://www.tht.org.uk', feedUrl: 'https://www.tht.org.uk/feed', category: 'health', priority: 'high', tags: ['health', 'hiv', 'uk', 'lgbtq'], region: 'uk', active: true },
  { name: 'Stonewall UK', url: 'https://www.stonewall.org.uk', feedUrl: 'https://www.stonewall.org.uk/feed', category: 'politics', priority: 'high', tags: ['lgbtq', 'uk', 'rights', 'policy'], region: 'uk', active: true },

  // ── US LGBTQ+ News ──
  { name: 'The Advocate', url: 'https://www.advocate.com', feedUrl: 'https://www.advocate.com/feed', category: 'politics', priority: 'medium', tags: ['lgbtq', 'politics', 'news'], region: 'us', active: true },
  { name: 'Them', url: 'https://www.them.us', feedUrl: 'https://www.them.us/feed/rss', category: 'culture', priority: 'medium', tags: ['lgbtq', 'trans', 'nonbinary', 'culture'], region: 'us', active: true },
  { name: 'Out Magazine', url: 'https://www.out.com', feedUrl: 'https://www.out.com/rss.xml', category: 'culture', priority: 'medium', tags: ['lgbtq', 'culture', 'entertainment'], region: 'us', active: true },
  { name: 'LGBTQ Nation', url: 'https://www.lgbtqnation.com', feedUrl: 'https://www.lgbtqnation.com/feed/', category: 'politics', priority: 'medium', tags: ['lgbtq', 'news', 'politics'], region: 'us', active: true },
  { name: 'Washington Blade', url: 'https://www.washingtonblade.com', feedUrl: 'https://www.washingtonblade.com/feed/', category: 'politics', priority: 'medium', tags: ['lgbtq', 'news', 'politics'], region: 'us', active: true },
  { name: 'Queerty', url: 'https://www.queerty.com', feedUrl: 'https://www.queerty.com/feed', category: 'culture', priority: 'low', tags: ['lgbtq', 'culture', 'entertainment'], region: 'us', active: true },
  { name: 'Instinct Magazine', url: 'https://instinctmagazine.com', feedUrl: 'https://instinctmagazine.com/feed/', category: 'culture', priority: 'low', tags: ['lgbtq', 'culture', 'entertainment'], region: 'us', active: true },

  // ── US Black Media (need LGBTQ keyword match to pass filter) ──
  { name: 'The Root', url: 'https://www.theroot.com', feedUrl: 'https://www.theroot.com/feed', category: 'community', priority: 'high', tags: ['black', 'news', 'culture'], region: 'us', active: true },
  { name: 'Essence', url: 'https://www.essence.com', feedUrl: 'https://www.essence.com/feed/', category: 'culture', priority: 'high', tags: ['black', 'women', 'culture'], region: 'us', active: true },
  { name: 'Blavity', url: 'https://blavity.com', feedUrl: 'https://cms.blavity.com/feed', category: 'culture', priority: 'medium', tags: ['black', 'culture', 'community'], region: 'us', active: true },

  // ── Health (HIV/wellbeing — high intersectional overlap) ──
  { name: 'The Body', url: 'https://www.thebody.com', feedUrl: 'https://www.thebody.com/feed', category: 'health', priority: 'high', tags: ['health', 'hiv', 'lgbtq', 'black'], region: 'us', active: true },

  // ── Africa ──
  { name: 'MambaOnline', url: 'https://www.mambaonline.com', feedUrl: 'https://www.mambaonline.com/feed/', category: 'community', priority: 'high', tags: ['lgbtq', 'black', 'african', 'news'], region: 'africa', active: true },
  { name: 'Kuchu Times', url: 'https://www.kuchutimes.com', feedUrl: 'https://www.kuchutimes.com/feed/', category: 'community', priority: 'high', tags: ['lgbtq', 'black', 'african', 'news'], region: 'africa', active: true },
  { name: 'Erasing 76 Crimes', url: 'https://76crimes.com', feedUrl: 'https://76crimes.com/feed/', category: 'politics', priority: 'high', tags: ['lgbtq', 'rights', 'african', 'caribbean', 'law'], region: 'global', active: true },
  { name: 'Minority Africa', url: 'https://minorityafrica.org', feedUrl: 'https://minorityafrica.org/feed/', category: 'community', priority: 'medium', tags: ['lgbtq', 'black', 'african', 'news'], region: 'africa', active: true },
  { name: 'Iranti', url: 'https://www.iranti.org.za', feedUrl: 'https://www.iranti.org.za/feed/', category: 'community', priority: 'medium', tags: ['lgbtq', 'trans', 'black', 'african'], region: 'africa', active: true },
  { name: 'Africa Is a Country', url: 'https://africasacountry.com', feedUrl: 'https://africasacountry.com/feed', category: 'culture', priority: 'medium', tags: ['black', 'african', 'culture', 'politics'], region: 'africa', active: true },

  // ── Caribbean & Global Rights ──
  { name: 'Human Dignity Trust', url: 'https://www.humandignitytrust.org', feedUrl: 'https://www.humandignitytrust.org/feed/', category: 'politics', priority: 'high', tags: ['lgbtq', 'rights', 'caribbean', 'african', 'law'], region: 'global', active: true },
  { name: 'Equality Jamaica', url: 'https://www.equalityjamaica.org', feedUrl: 'https://www.equalityjamaica.org/feed/', category: 'politics', priority: 'medium', tags: ['lgbtq', 'caribbean', 'rights', 'black'], region: 'caribbean', active: true },

  // ── International LGBTQ+ ──
  { name: 'Xtra Magazine', url: 'https://xtramagazine.com', feedUrl: 'https://xtramagazine.com/feed', category: 'culture', priority: 'medium', tags: ['lgbtq', 'culture', 'politics'], region: 'global', active: true },
  { name: 'Star Observer', url: 'https://www.starobserver.com.au', feedUrl: 'https://www.starobserver.com.au/feed', category: 'community', priority: 'low', tags: ['lgbtq', 'news'], region: 'global', active: true },
  { name: 'Autostraddle', url: 'https://www.autostraddle.com', feedUrl: 'https://www.autostraddle.com/feed/', category: 'culture', priority: 'medium', tags: ['lgbtq', 'lesbian', 'queer', 'culture'], region: 'global', active: true },
];

const NEWSAPI_QUERIES = [
  { query: 'Black LGBTQ UK', category: 'community', priority: 'high' },
  { query: 'Black queer Britain', category: 'culture', priority: 'high' },
  { query: 'LGBTQ rights UK', category: 'politics', priority: 'high' },
  { query: 'Black Pride UK', category: 'culture', priority: 'high' },
  { query: 'transgender rights Britain', category: 'politics', priority: 'high' },
];

// ============== ARTICLE TYPES ==============

interface FetchedArticle {
  title: string;
  excerpt: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  author: string;
  publishedAt: string;
  featuredImage?: string;
  imageAlt?: string;
  category: string;
  relevanceScore: number;
  urlHash: string;
  tags: string[];
}

// ============== UTILITY FUNCTIONS ==============

function generateUrlHash(url: string): string {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImage(item: any): string | undefined {
  if (item.media?.['$']?.url) return item.media['$'].url;
  if (item.thumbnail?.['$']?.url) return item.thumbnail['$'].url;
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) return item.enclosure.url;
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];
  }
  return undefined;
}

function calculateRelevanceScore(title: string, content: string, sourceTags: string[]): number {
  const text = `${title} ${content}`.toLowerCase();

  // Explicit Black LGBTQ+ intersectional terms — automatic high relevance
  const intersectionalTerms = [
    'black queer', 'black gay', 'black lgbtq', 'black trans', 'black lesbian',
    'qtipoc', 'qpoc', 'blkout', 'black pride', 'uk black pride',
    'african diaspora lgbtq', 'caribbean lgbtq', 'black bisexual',
    'black nonbinary', 'black non-binary', 'queer african', 'queer caribbean',
    'lgbtq africa', 'lgbtq caribbean', 'lgbtq jamaica', 'lgbtq uganda',
    'lgbtq nigeria', 'lgbtq kenya', 'lgbtq ghana', 'lgbtq south africa',
    'gay africa', 'gay jamaica', 'gay uganda', 'gay nigeria',
    'homophobia africa', 'homophobia caribbean', 'anti-gay africa',
    'decriminali', // catches decriminalisation/decriminalization
    'sodomy law', 'anti-homosexuality', 'conversion therapy africa',
  ];

  // Check for explicit intersectional content — these always pass
  for (const term of intersectionalTerms) {
    if (text.includes(term)) return 100;
  }

  // Check source tag composition
  const hasBlackTag = sourceTags.some(t => ['black', 'african', 'caribbean'].includes(t.toLowerCase()));
  const hasLgbtqTag = sourceTags.some(t => ['lgbtq', 'queer', 'gay', 'lesbian', 'trans'].includes(t.toLowerCase()));
  const isIntersectionalSource = hasBlackTag && hasLgbtqTag;

  // LGBTQ+ keywords
  const lgbtqKeywords = ['lgbtq', 'queer', 'gay', 'lesbian', 'trans', 'bisexual', 'pride', 'nonbinary', 'non-binary', 'drag', 'same-sex', 'homosexual', 'homophobia', 'rainbow'];
  // Black community keywords
  const blackKeywords = ['black', 'african', 'caribbean', 'windrush', 'diaspora', 'afro', 'nigeria', 'uganda', 'kenya', 'ghana', 'south africa', 'jamaica', 'trinidad', 'barbados', 'guyana'];

  const hasLgbtqContent = lgbtqKeywords.some(kw => text.includes(kw));
  const hasBlackContent = blackKeywords.some(kw => text.includes(kw));

  // BEST: Article explicitly covers both communities
  if (hasLgbtqContent && hasBlackContent) {
    let score = 80;
    if (text.includes('uk') || text.includes('britain') || text.includes('london')) score += 10;
    return Math.min(100, score);
  }

  // GOOD: Source is inherently intersectional (tagged both black + lgbtq)
  // e.g. MambaOnline, Kuchu Times, gal-dem, The Body
  // These sources' LGBTQ content IS about Black people by default
  if (isIntersectionalSource) {
    if (hasLgbtqContent || hasBlackContent) return 70;
    // Even general articles from these sources have community value
    return 40;
  }

  // OK: LGBTQ article from a Black source (e.g. The Root covering Pride)
  if (hasBlackTag && hasLgbtqContent) return 75;

  // OK: Black article from an LGBTQ source (e.g. PinkNews covering racism)
  if (hasLgbtqTag && hasBlackContent) return 75;

  // Articles that only cover one community without the other — reject
  return 0;
}

// ============== RSS FETCHER ==============

let rssParser: any = null;
async function getParser() {
  if (!rssParser) {
    const Parser = (await import('rss-parser')).default;
    rssParser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:content', 'media'],
          ['media:thumbnail', 'thumbnail'],
          ['enclosure', 'enclosure'],
          ['dc:creator', 'creator'],
        ],
      },
    });
  }
  return rssParser;
}

async function fetchFromRssFeed(source: NewsSource): Promise<FetchedArticle[]> {
  if (!source.feedUrl) return [];

  try {
    const parser = await getParser();
    const feed = await parser.parseURL(source.feedUrl);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items.slice(0, 20)) {
      if (!item.link || !item.title) continue;

      const content = cleanHtml(item.content || item.contentSnippet || item.summary || '');
      const excerpt = cleanHtml(item.contentSnippet || item.summary || item.content || '').slice(0, 300);

      articles.push({
        title: item.title.trim(),
        excerpt: excerpt + (excerpt.length >= 300 ? '...' : ''),
        content,
        sourceUrl: item.link,
        sourceName: source.name,
        author: item.creator || item.author || source.name,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        featuredImage: extractImage(item),
        imageAlt: item.title,
        category: source.category,
        relevanceScore: calculateRelevanceScore(item.title, content, source.tags),
        urlHash: generateUrlHash(item.link),
        tags: source.tags,
      });
    }

    console.log(`[RSS] Fetched ${articles.length} articles from ${source.name}`);
    return articles;
  } catch (error) {
    console.error(`[RSS] Error fetching from ${source.name}:`, error);
    return [];
  }
}

// ============== NEWSAPI FETCHER ==============

async function fetchFromNewsApi(apiKey: string): Promise<FetchedArticle[]> {
  if (!apiKey) {
    console.log('[NewsAPI] No API key provided, skipping');
    return [];
  }

  const articles: FetchedArticle[] = [];

  for (const queryConfig of NEWSAPI_QUERIES.slice(0, 5)) {
    try {
      const params = new URLSearchParams({
        q: queryConfig.query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '10',
        apiKey,
      });

      const response = await fetch(`https://newsapi.org/v2/everything?${params}`);

      if (!response.ok) {
        console.error(`[NewsAPI] Query "${queryConfig.query}" failed:`, response.statusText);
        continue;
      }

      const data = await response.json();

      if (data.articles) {
        for (const item of data.articles) {
          if (!item.url || !item.title || item.title === '[Removed]') continue;

          const content = item.content || item.description || '';

          articles.push({
            title: item.title,
            excerpt: item.description || content.slice(0, 300),
            content,
            sourceUrl: item.url,
            sourceName: item.source?.name || 'NewsAPI',
            author: item.author || item.source?.name || 'Unknown',
            publishedAt: item.publishedAt || new Date().toISOString(),
            featuredImage: item.urlToImage,
            imageAlt: item.title,
            category: queryConfig.category,
            relevanceScore: calculateRelevanceScore(item.title, content, ['newsapi', queryConfig.category]),
            urlHash: generateUrlHash(item.url),
            tags: ['newsapi', queryConfig.category],
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[NewsAPI] Error for query "${queryConfig.query}":`, error);
    }
  }

  console.log(`[NewsAPI] Fetched ${articles.length} articles total`);
  return articles;
}

// ============== MAIN FETCH FUNCTION ==============

async function fetchAllNews(newsApiKey?: string) {
  console.log('[Fetch] Starting news fetch...');

  const sources = RSS_SOURCES.filter(s => s.active);
  console.log(`[Fetch] Active RSS sources: ${sources.length}`);

  // Fetch from RSS feeds in parallel
  const rssPromises = sources.map(source => fetchFromRssFeed(source));
  const rssResults = await Promise.all(rssPromises);
  const rssArticles = rssResults.flat();

  // Fetch from NewsAPI
  const newsApiArticles = await fetchFromNewsApi(newsApiKey || '');

  // Combine all articles
  const allArticles = [...rssArticles, ...newsApiArticles];
  console.log(`[Fetch] Total fetched: ${allArticles.length}`);

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = allArticles.filter(a => {
    if (seen.has(a.urlHash)) return false;
    seen.add(a.urlHash);
    return true;
  });

  // Filter by relevance - only keep intersectional Black LGBTQ+ content (score > 0)
  const filtered = deduplicated.filter(a => a.relevanceScore > 0);

  // Sort by relevance and date
  const sorted = filtered.sort((a, b) => {
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 10) return relevanceDiff;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  return {
    articles: sorted,
    stats: {
      totalFetched: allArticles.length,
      afterDedup: deduplicated.length,
      afterFilter: filtered.length,
      sources: sources.length + (newsApiKey ? 1 : 0),
    },
  };
}

// ============== DATABASE FUNCTIONS ==============

async function articleExists(urlHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('news_articles')
    .select('id')
    .eq('url_hash', urlHash)
    .maybeSingle();

  return !!data;
}

async function insertArticle(article: FetchedArticle): Promise<boolean> {
  const { error } = await supabase
    .from('news_articles')
    .insert({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      source_url: article.sourceUrl,
      source_name: article.sourceName,
      author: article.author,
      published_at: article.publishedAt,
      featured_image: article.featuredImage,
      image_alt: article.imageAlt,
      category: article.category,
      interest_score: Math.min(100, article.relevanceScore),
      url_hash: article.urlHash,
      read_time: `${Math.ceil(article.content.split(/\s+/).length / 200)} min read`,
      status: 'review',
      published: false,
      moderation_status: 'pending',
      topics: article.tags,
    });

  if (error) {
    if (error.code === '23505') return false; // Duplicate
    console.error(`[Insert] Error:`, error);
    return false;
  }

  return true;
}

// ============== HANDLER ==============

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // For POST requests, verify authorization
  if (req.method === 'POST') {
    const authHeader = req.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
    const isAuthorized =
      !process.env.CRON_SECRET ||
      authHeader === expectedSecret ||
      req.query.manual === 'true';

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const preview = req.query.preview === 'true';
  const highPriorityOnly = req.query.priority === 'high';

  try {
    const { articles, stats } = await fetchAllNews(process.env.NEWSAPI_KEY);

    // Preview mode - just return what would be fetched
    if (preview || req.method === 'GET') {
      return res.status(200).json({
        success: true,
        mode: 'preview',
        timestamp: new Date().toISOString(),
        stats,
        articles: articles.slice(0, 20).map(a => ({
          title: a.title,
          source: a.sourceName,
          category: a.category,
          relevance: a.relevanceScore,
          url: a.sourceUrl,
          publishedAt: a.publishedAt,
        })),
        totalAvailable: articles.length,
      });
    }

    // POST - Actually insert articles
    if (req.method === 'POST') {
      let inserted = 0;
      let skipped = 0;

      for (const article of articles) {
        const exists = await articleExists(article.urlHash);

        if (exists) {
          skipped++;
          continue;
        }

        const success = await insertArticle(article);
        if (success) {
          inserted++;
        } else {
          skipped++;
        }
      }

      return res.status(200).json({
        success: true,
        mode: 'insert',
        timestamp: new Date().toISOString(),
        stats: {
          ...stats,
          newArticles: inserted,
          skippedDuplicates: skipped,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[FetchNews] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
