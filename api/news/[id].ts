import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { id } = req.query;

      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .eq('published', true)
        .eq('status', 'published')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Same rule vote.ts enforces: no vote button on a closed period's article.
      let votingOpen = true;
      if (data.voting_period_id) {
        const { data: period } = await supabase
          .from('voting_periods')
          .select('status')
          .eq('id', data.voting_period_id)
          .maybeSingle();
        votingOpen = !period || period.status === 'active';
      }

      return res.status(200).json({
        success: true,
        data: { ...data, votingOpen },
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
