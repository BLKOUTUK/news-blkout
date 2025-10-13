import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Use VITE_ prefixed env vars for consistency
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

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

      // Submit to news_articles with pending moderation status
      const { data, error } = await supabase
        .from('news_articles')
        .insert([
          {
            title,
            original_url: url,
            excerpt: excerpt || '',
            category: category || 'community',
            content: content || '',
            author: submittedBy,
            read_time: '5 min read', // Default read time, can be calculated later
            status: 'draft', // Set to draft until approved
            moderation_status: 'pending', // Pending moderator approval
            published_at: new Date().toISOString(),
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Supabase URL configured:', !!supabaseUrl);
        console.error('Supabase Key configured:', !!supabaseKey);
        return res.status(500).json({
          success: false,
          error: `Failed to submit article: ${error.message || 'Unknown error'}`,
          details: error.hint || error.details || 'No additional details'
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
