import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/archive
 * Returns past voting periods with their top 3 winners
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '10', offset = '0' } = req.query;

    // Fetch archived periods ordered by most recent first
    const { data: periods, error: periodsError } = await supabase
      .from('voting_periods')
      .select('*')
      .eq('status', 'archived')
      .order('period_number', { ascending: false })
      .range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1
      );

    if (periodsError) {
      console.error('Error fetching archived periods:', periodsError);
      return res.status(500).json({ success: false, error: 'Failed to fetch archive' });
    }

    if (!periods || periods.length === 0) {
      return res.status(200).json({
        success: true,
        data: { periods: [], total: 0 },
      });
    }

    // For each period, fetch the top 3 winner articles
    const periodsWithWinners = await Promise.all(
      periods.map(async (period) => {
        const winnerIds = [period.winner_1_id, period.winner_2_id, period.winner_3_id].filter(Boolean);

        let winners: any[] = [];
        if (winnerIds.length > 0) {
          const { data: articles } = await supabase
            .from('news_articles')
            .select('id, title, excerpt, featured_image, image_alt, category, author, source_name, source_url, read_time, published_at, upvote_count, total_votes, interest_score, weekly_rank, is_story_of_week')
            .in('id', winnerIds);

          if (articles) {
            // Sort by weekly_rank to preserve 1st, 2nd, 3rd ordering
            winners = articles.sort((a, b) => (a.weekly_rank || 99) - (b.weekly_rank || 99));
          }
        }

        return {
          id: period.id,
          periodNumber: period.period_number,
          startDate: period.start_date,
          endDate: period.end_date,
          totalArticles: period.total_articles,
          totalVotes: period.total_votes,
          winners: winners.map((w) => ({
            ...w,
            publishedAt: w.published_at,
            totalVotes: w.total_votes,
            upvoteCount: w.upvote_count,
            interestScore: w.interest_score,
            weeklyRank: w.weekly_rank,
            isStoryOfWeek: w.is_story_of_week,
            featuredImage: w.featured_image,
            imageAlt: w.image_alt,
            sourceName: w.source_name,
            sourceUrl: w.source_url,
            readTime: w.read_time,
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        periods: periodsWithWinners,
        total: periodsWithWinners.length,
      },
    });
  } catch (error) {
    console.error('Archive API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
