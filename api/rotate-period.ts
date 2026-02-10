import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

/**
 * POST /api/rotate-period
 * Locks the current period, picks top 3 winners, archives non-winners, creates next period.
 * Protected by CRON_SECRET.
 */
export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && (!authHeader || authHeader !== `Bearer ${cronSecret}`)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // 1. Get current active period
    const { data: activePeriod, error: periodError } = await supabase
      .from('voting_periods')
      .select('*')
      .eq('status', 'active')
      .order('period_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (periodError || !activePeriod) {
      return res.status(404).json({
        success: false,
        error: 'No active voting period found',
      });
    }

    // 2. Get all published articles in this period, ranked by total_votes desc
    const { data: articles, error: articlesError } = await supabase
      .from('news_articles')
      .select('id, title, total_votes, upvote_count, interest_score')
      .eq('voting_period_id', activePeriod.id)
      .eq('status', 'published')
      .order('total_votes', { ascending: false })
      .order('interest_score', { ascending: false });

    if (articlesError) {
      console.error('Error fetching period articles:', articlesError);
      return res.status(500).json({ success: false, error: 'Failed to fetch articles' });
    }

    const allArticles = articles || [];
    const top3 = allArticles.slice(0, 3);
    const rest = allArticles.slice(3);

    // 3. Mark top 3 winners
    for (let i = 0; i < top3.length; i++) {
      await supabase
        .from('news_articles')
        .update({
          weekly_rank: i + 1,
          is_story_of_week: i === 0,
        })
        .eq('id', top3[i].id);
    }

    // 4. Archive non-winners (status -> 'archived', published -> false)
    if (rest.length > 0) {
      const restIds = rest.map((a) => a.id);
      await supabase
        .from('news_articles')
        .update({ status: 'archived', published: false })
        .in('id', restIds);
    }

    // 5. Archive the voting period with winner references
    const totalVotes = allArticles.reduce((sum, a) => sum + (a.total_votes || 0), 0);
    await supabase
      .from('voting_periods')
      .update({
        status: 'archived',
        winner_1_id: top3[0]?.id || null,
        winner_2_id: top3[1]?.id || null,
        winner_3_id: top3[2]?.id || null,
        total_articles: allArticles.length,
        total_votes: totalVotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activePeriod.id);

    // 6. Create next period (starts now, ends in 14 days)
    const nextNumber = activePeriod.period_number + 1;
    const now = new Date();
    // Start at midnight UK time today
    const startDate = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000 - 1000);

    const { data: newPeriod, error: createError } = await supabase
      .from('voting_periods')
      .insert({
        period_number: nextNumber,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating next period:', createError);
      return res.status(500).json({ success: false, error: 'Failed to create next period' });
    }

    return res.status(200).json({
      success: true,
      data: {
        archivedPeriod: {
          periodNumber: activePeriod.period_number,
          totalArticles: allArticles.length,
          totalVotes,
          winners: top3.map((a, i) => ({
            rank: i + 1,
            id: a.id,
            title: a.title,
            votes: a.total_votes,
          })),
          articlesArchived: rest.length,
        },
        newPeriod: {
          periodNumber: newPeriod.period_number,
          startDate: newPeriod.start_date,
          endDate: newPeriod.end_date,
        },
      },
    });
  } catch (error) {
    console.error('Rotate period error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
