import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/top-stories?period=week&limit=10
 * Get top stories ranked by engagement score
 *
 * Engagement Score Formula:
 * upvotes + (comment_count * 2) + (share_count * 1.5)
 */
export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { period = 'week', limit = '10' } = req.query;
      const take = parseInt(limit as string, 10);

      // Calculate date range based on period. 'all' means no floor at all —
      // it is the caller's last-resort backfill and must not be capped.
      let startDate: Date | null;
      const now = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'all':
          startDate = null;
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Fresh builder per call — a Supabase query builder cannot be reused.
      // Ordered by votes then recency, so a period in which nobody has voted
      // still comes back in a sensible order rather than an arbitrary one.
      const baseQuery = () =>
        supabase
          .from('news_articles')
          .select(`
            id,
            title,
            excerpt,
            featured_image,
            image_alt,
            category,
            author,
            source_name,
            source_url,
            read_time,
            published_at,
            upvote_count,
            total_votes,
            interest_score
          `)
          .eq('published', true)
          .eq('status', 'published')
          .order('upvote_count', { ascending: false })
          .order('published_at', { ascending: false })
          .limit(take * 2);

      const { data: activePeriod } = await supabase
        .from('voting_periods')
        .select('id')
        .eq('status', 'active')
        .order('period_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Prefer the active voting period. It opens empty every fortnight, so an
      // empty result there must fall through to the date window rather than be
      // returned as "no stories" — otherwise every period-start request is dead.
      let articles: any[] | null = null;
      let source = 'date-range';

      if (activePeriod) {
        const { data, error: periodError } = await baseQuery().eq(
          'voting_period_id',
          activePeriod.id
        );

        if (periodError) {
          console.error('Error fetching articles for voting period:', periodError);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch top stories',
          });
        }

        if (data && data.length > 0) {
          articles = data;
          source = 'voting-period';
        }
      }

      if (!articles) {
        let fallbackQuery = baseQuery();
        if (startDate) {
          fallbackQuery = fallbackQuery.gte('published_at', startDate.toISOString());
        }

        const { data, error: fallbackError } = await fallbackQuery;

        if (fallbackError) {
          console.error('Error fetching articles:', fallbackError);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch top stories',
          });
        }

        articles = data;
      }

      if (!articles || articles.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            period,
            source: 'none',
            topStories: [],
            storyOfThePeriod: null,
          },
        });
      }

      // Calculate engagement scores for each article
      const articlesWithScores = await Promise.all(
        articles.map(async (article) => {
          // Count shares from analytics
          const { count: shareCount } = await supabase
            .from('newsroom_analytics')
            .select('*', { count: 'exact', head: true })
            .eq('article_id', article.id)
            .eq('event_type', 'share');

          // Count comments (if comment system exists - placeholder for now)
          const commentCount = 0; // TODO: Add when comment system is implemented

          // Calculate engagement score
          // Formula: upvotes + (comments * 2) + (shares * 1.5)
          const engagementScore =
            (article.upvote_count || 0) +
            commentCount * 2 +
            (shareCount || 0) * 1.5;

          return {
            ...article,
            shareCount: shareCount || 0,
            commentCount,
            engagementScore,
          };
        })
      );

      // Sort by engagement score
      articlesWithScores.sort((a, b) => b.engagementScore - a.engagementScore);

      // Get top articles based on limit
      const topStories = articlesWithScores.slice(0, take);

      // Story of the period is the top-ranked article
      const storyOfThePeriod = topStories[0] || null;

      return res.status(200).json({
        success: true,
        data: {
          period,
          source,
          topStories,
          storyOfThePeriod,
          calculatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('API error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
