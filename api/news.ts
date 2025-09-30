import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { category, sortBy = 'interest', status = 'published', limit = '20' } = req.query;

      let query = supabase
        .from('newsroom_articles')
        .select('*')
        .eq('status', status)
        .limit(parseInt(limit as string, 10));

      // Filter by category
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Sort
      if (sortBy === 'interest') {
        query = query.order('interest_score', { ascending: false });
      } else if (sortBy === 'weekly') {
        query = query.order('is_story_of_week', { ascending: false })
                     .order('weekly_rank', { ascending: true });
      } else {
        query = query.order('published_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch articles',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          articles: data || [],
          total: data?.length || 0,
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
