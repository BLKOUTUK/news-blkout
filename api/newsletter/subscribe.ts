import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { email, frequency = 'weekly', categories = [] } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email is required',
        });
      }

      const { data, error } = await supabase
        .from('newsletter_subscriptions')
        .insert([
          {
            email,
            frequency,
            categories,
            subscribed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to subscribe',
        });
      }

      return res.status(200).json({
        success: true,
        data,
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
