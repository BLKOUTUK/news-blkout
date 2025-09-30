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
      const {
        title,
        url,
        excerpt,
        category,
        content,
        submittedBy = 'anonymous',
        type = 'story'
      } = req.body;

      // Validation
      if (!title || !url) {
        return res.status(400).json({
          success: false,
          error: 'Title and URL are required',
        });
      }

      // Submit to moderation queue
      const { data, error } = await supabase
        .from('moderation_queue')
        .insert([
          {
            title,
            url,
            excerpt: excerpt || '',
            category: category || 'community',
            content: content || '',
            type,
            status: 'pending',
            submitted_by: submittedBy,
            submitted_at: new Date().toISOString(),
            votes: 0,
            priority: 'medium',
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return res.status(500).json({
          success: false,
          error: 'Failed to submit article',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Article submitted for moderation',
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
