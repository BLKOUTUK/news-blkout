import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: Request, res: Response) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.error('Server configuration error: SUPABASE_URL or SUPABASE_ANON_KEY is not set.');
    return res.status(500).json({
      success: false,
      error: 'Server configuration error. Please check environment variables.',
    });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, sortBy = 'interest', limit = '20', offset = '0', period } = req.query;

      const limitNum = parseInt(limit as string, 10);
      const offsetNum = parseInt(offset as string, 10);

      // A fresh builder per call — a Supabase query builder cannot be reused
      // across the active-period attempt and a previous-period fallback.
      const baseQuery = () => {
        let q = supabase
          .from('news_articles')
          .select('*')
          .eq('published', true)
          .eq('status', 'published')
          .range(offsetNum, offsetNum + limitNum - 1);

        if (category && category !== 'all') {
          q = q.eq('category', category);
        }

        if (sortBy === 'interest') {
          // After first week, prioritize articles by total votes then interest score
          // For articles published more than 7 days ago, votes matter most
          q = q.order('total_votes', { ascending: false })
               .order('interest_score', { ascending: false })
               .order('published_at', { ascending: false });
        } else if (sortBy === 'weekly') {
          q = q.order('is_story_of_week', { ascending: false })
               .order('weekly_rank', { ascending: true });
        } else {
          q = q.order('published_at', { ascending: false });
        }

        return q;
      };

      let data: any[] | null = null;
      let error: any = null;
      let source = 'none';

      if (period === 'all') {
        const allResult = await baseQuery();
        error = allResult.error;
        data = allResult.data;
        source = 'all-time';
      } else {
        const { data: activePeriod } = await supabase
          .from('voting_periods')
          .select('id')
          .eq('status', 'active')
          .order('period_number', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePeriod) {
          const activeResult = await baseQuery().eq('voting_period_id', activePeriod.id);
          if (activeResult.error) {
            error = activeResult.error;
          } else if (activeResult.data && activeResult.data.length > 0) {
            data = activeResult.data;
            source = 'voting-period';
          }
        }

        // A voting period opens empty every rotation — the weekly-rollover gap
        // this fills. Fall back to the most recently CLOSED period rather than
        // showing the whole page as empty until something fresh is approved.
        if (!error && !data) {
          const { data: lastClosed } = await supabase
            .from('voting_periods')
            .select('id')
            .neq('status', 'active')
            .order('period_number', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastClosed) {
            const closedResult = await baseQuery().eq('voting_period_id', lastClosed.id);
            if (closedResult.error) {
              error = closedResult.error;
            } else if (closedResult.data && closedResult.data.length > 0) {
              data = closedResult.data;
              source = 'voting-period-previous';
            }
          }
        }
      }

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch articles',
        });
      }

      // Transform snake_case to camelCase for frontend
      const transformedArticles = (data || []).map((article: any) => ({
        ...article,
        publishedAt: article.published_at,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        isStoryOfWeek: article.is_story_of_week,
        weeklyRank: article.weekly_rank,
        totalVotes: article.total_votes,
        interestScore: article.interest_score,
      }));

      return res.status(200).json({
        success: true,
        data: {
          articles: transformedArticles,
          total: transformedArticles.length,
          source,
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
