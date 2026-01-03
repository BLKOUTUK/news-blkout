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

      // Calculate date range based on period
      let startDate: Date;
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
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Fetch articles with their engagement metrics
      const { data: articles, error } = await supabase
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
        .gte('published_at', startDate.toISOString())
        .order('upvote_count', { ascending: false })
        .limit(parseInt(limit as string, 10) * 2); // Fetch extra for sorting

      if (error) {
        console.error('Error fetching articles:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch top stories',
        });
      }

      if (!articles || articles.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            period,
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
      const topStories = articlesWithScores.slice(0, parseInt(limit as string, 10));

      // Story of the period is the top-ranked article
      const storyOfThePeriod = topStories[0] || null;

      return res.status(200).json({
        success: true,
        data: {
          period,
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
