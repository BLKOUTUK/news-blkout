/**
 * Vercel Cron Job: Fetch News
 *
 * This endpoint is called by Vercel Cron to automatically
 * fetch and ingest news from configured sources.
 *
 * Schedule: Every 6 hours (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET header
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { fetchAllNews, type FetchedArticle } from '../lib/news-fetcher';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Check if article already exists by URL hash
 */
async function articleExists(urlHash: string): Promise<boolean> {
  const { data } = await supabase
    .from('news_articles')
    .select('id')
    .eq('url_hash', urlHash)
    .maybeSingle();

  return !!data;
}

/**
 * Insert article into database
 */
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
    // Ignore duplicate key errors (concurrent inserts)
    if (error.code === '23505') return false;
    console.error(`[Insert] Error:`, error);
    return false;
  }

  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify cron secret (security measure)
  const cronSecret = req.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  // Allow manual trigger in development or with correct secret
  const isAuthorized =
    process.env.NODE_ENV === 'development' ||
    cronSecret === expectedSecret ||
    req.query.manual === 'true'; // For testing

  if (!isAuthorized && process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Cron] Starting news fetch job...');

  try {
    // Fetch news from all sources
    const { articles, stats } = await fetchAllNews(process.env.NEWSAPI_KEY);

    console.log(`[Cron] Fetched ${stats.totalFetched} articles, ${stats.afterFilter} after filtering`);

    // Insert new articles
    let inserted = 0;
    let skipped = 0;

    for (const article of articles) {
      // Check if already exists
      const exists = await articleExists(article.urlHash);

      if (exists) {
        skipped++;
        continue;
      }

      // Insert new article
      const success = await insertArticle(article);
      if (success) {
        inserted++;
      } else {
        skipped++;
      }

      // Rate limit insertions
      if (inserted % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        ...stats,
        newArticles: inserted,
        skippedDuplicates: skipped,
      },
    };

    console.log('[Cron] Job complete:', result);

    return res.status(200).json(result);
  } catch (error) {
    console.error('[Cron] Error:', error);

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
