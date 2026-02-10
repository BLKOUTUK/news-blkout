import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/voting-period
 * Returns current active voting period info (number, end date, days remaining)
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
    const { data: period, error } = await supabase
      .from('voting_periods')
      .select('*')
      .eq('status', 'active')
      .order('period_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching voting period:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch voting period' });
    }

    if (!period) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const now = new Date();
    const endDate = new Date(period.end_date);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return res.status(200).json({
      success: true,
      data: {
        id: period.id,
        periodNumber: period.period_number,
        startDate: period.start_date,
        endDate: period.end_date,
        daysRemaining,
        totalArticles: period.total_articles,
        totalVotes: period.total_votes,
        status: period.status,
      },
    });
  } catch (error) {
    console.error('Voting period API error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
