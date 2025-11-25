/**
 * Manual News Fetch Trigger
 *
 * Allows manual triggering of the news fetch process
 * for testing and on-demand updates.
 *
 * GET /api/fetch-news?preview=true - Preview what would be fetched
 * POST /api/fetch-news - Actually fetch and insert news
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { fetchAllNews, fetchHighPriorityNews, type FetchedArticle } from './lib/news-fetcher';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
      status: 'published',
      moderation_status: 'auto-approved',
      topics: article.tags,
    });

  if (error) {
    if (error.code === '23505') return false; // Duplicate
    console.error(`[Insert] Error:`, error);
    return false;
  }

  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // For POST requests, verify authorization (cron secret or manual trigger)
  if (req.method === 'POST') {
    const authHeader = req.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;
    const isAuthorized =
      !process.env.CRON_SECRET || // Allow if no secret set
      authHeader === expectedSecret ||
      req.query.manual === 'true'; // Allow manual testing

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const preview = req.query.preview === 'true';
  const highPriorityOnly = req.query.priority === 'high';

  try {
    let articles: FetchedArticle[];
    let stats: any;

    if (highPriorityOnly) {
      articles = await fetchHighPriorityNews();
      stats = { totalFetched: articles.length, sources: 'high-priority-only' };
    } else {
      const result = await fetchAllNews(process.env.NEWSAPI_KEY);
      articles = result.articles;
      stats = result.stats;
    }

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
