/**
 * News Fetcher Service
 *
 * Fetches news from RSS feeds and NewsAPI, processes them,
 * and prepares them for database insertion.
 */

import crypto from 'crypto';
import {
  getActiveRssSources,
  NEWSAPI_QUERIES,
  autoCategorize,
  calculateRelevanceScore,
  type NewsSource,
} from './news-sources';

// Lazy-load rss-parser to avoid module resolution issues
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

export interface FetchedArticle {
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

/**
 * Generate URL hash for deduplication
 */
export function generateUrlHash(url: string): string {
  return crypto.createHash('md5').update(url.toLowerCase().trim()).digest('hex');
}

/**
 * Extract image URL from RSS item
 */
function extractImage(item: any): string | undefined {
  // Try media:content
  if (item.media?.['$']?.url) {
    return item.media['$'].url;
  }
  // Try media:thumbnail
  if (item.thumbnail?.['$']?.url) {
    return item.thumbnail['$'].url;
  }
  // Try enclosure
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url;
  }
  // Try to extract from content
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) return imgMatch[1];
  }
  return undefined;
}

/**
 * Clean HTML from text
 */
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

/**
 * Calculate read time from content
 */
function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${Math.max(1, minutes)} min read`;
}

/**
 * Fetch articles from a single RSS feed
 */
async function fetchFromRssFeed(source: NewsSource): Promise<FetchedArticle[]> {
  if (!source.feedUrl) return [];

  try {
    const parser = await getParser();
    const feed = await parser.parseURL(source.feedUrl);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items.slice(0, 20)) { // Limit to 20 items per feed
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
        relevanceScore: calculateRelevanceScore(item.title, content),
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

/**
 * Fetch articles from NewsAPI
 */
async function fetchFromNewsApi(apiKey: string): Promise<FetchedArticle[]> {
  if (!apiKey) {
    console.log('[NewsAPI] No API key provided, skipping');
    return [];
  }

  const articles: FetchedArticle[] = [];

  for (const queryConfig of NEWSAPI_QUERIES.slice(0, 5)) { // Limit queries to conserve API calls
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
            relevanceScore: calculateRelevanceScore(item.title, content),
            urlHash: generateUrlHash(item.url),
            tags: ['newsapi', queryConfig.category],
          });
        }
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[NewsAPI] Error for query "${queryConfig.query}":`, error);
    }
  }

  console.log(`[NewsAPI] Fetched ${articles.length} articles total`);
  return articles;
}

/**
 * Deduplicate articles by URL hash
 */
function deduplicateArticles(articles: FetchedArticle[]): FetchedArticle[] {
  const seen = new Set<string>();
  const unique: FetchedArticle[] = [];

  for (const article of articles) {
    if (!seen.has(article.urlHash)) {
      seen.add(article.urlHash);
      unique.push(article);
    }
  }

  console.log(`[Dedup] ${articles.length} -> ${unique.length} articles (removed ${articles.length - unique.length} duplicates)`);
  return unique;
}

/**
 * Filter articles by relevance score
 */
function filterByRelevance(articles: FetchedArticle[], minScore: number = 40): FetchedArticle[] {
  const filtered = articles.filter(a => a.relevanceScore >= minScore);
  console.log(`[Filter] Kept ${filtered.length}/${articles.length} articles with relevance >= ${minScore}`);
  return filtered;
}

/**
 * Sort articles by relevance and recency
 */
function sortArticles(articles: FetchedArticle[]): FetchedArticle[] {
  return articles.sort((a, b) => {
    // Primary sort by relevance
    const relevanceDiff = b.relevanceScore - a.relevanceScore;
    if (Math.abs(relevanceDiff) > 10) return relevanceDiff;

    // Secondary sort by date
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Main fetch function - fetches from all sources
 */
export async function fetchAllNews(newsApiKey?: string): Promise<{
  articles: FetchedArticle[];
  stats: {
    totalFetched: number;
    afterDedup: number;
    afterFilter: number;
    sources: number;
  };
}> {
  console.log('[Fetch] Starting news fetch...');

  const sources = getActiveRssSources();
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

  // Process articles
  const deduplicated = deduplicateArticles(allArticles);
  const filtered = filterByRelevance(deduplicated, 35);
  const sorted = sortArticles(filtered);

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

/**
 * Fetch only from high-priority sources (for quick updates)
 */
export async function fetchHighPriorityNews(): Promise<FetchedArticle[]> {
  const sources = getActiveRssSources().filter(s => s.priority === 'high');

  const promises = sources.map(source => fetchFromRssFeed(source));
  const results = await Promise.all(promises);

  return deduplicateArticles(results.flat());
}
