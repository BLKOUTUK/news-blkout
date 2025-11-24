import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * GET /api/user-vote?articleId={id}
 * Check if the authenticated user has upvoted a specific article
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const { articleId } = req.query;

      if (!articleId || typeof articleId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }

      // Get authorization header
      const authHeader = req.headers.authorization;

      // If no auth, return not voted
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({
          success: true,
          data: {
            hasUpvoted: false,
            articleId,
          },
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token and get user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      // If auth fails, return not voted (don't error)
      if (authError || !user) {
        return res.status(200).json({
          success: true,
          data: {
            hasUpvoted: false,
            articleId,
          },
        });
      }

      // Check if user has voted for this article
      const { data: vote, error: voteError } = await supabase
        .from('news_votes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (voteError) {
        console.error('Error checking vote:', voteError);
        return res.status(500).json({
          success: false,
          error: 'Failed to check vote status',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          hasUpvoted: !!vote,
          articleId,
          userId: user.id,
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
