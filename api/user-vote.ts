import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Generate anonymous voter ID from IP + User-Agent
 */
function generateVoterId(req: VercelRequest): string {
  const ip = req.headers['x-forwarded-for'] ||
             req.headers['x-real-ip'] ||
             req.socket?.remoteAddress ||
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  const hash = crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 32);

  return `anon_${hash}`;
}

/**
 * GET /api/user-vote?articleId={id}
 * Check if the current visitor/user has upvoted a specific article
 * Supports both authenticated and anonymous voting
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

      // Check for authenticated user first
      const authHeader = req.headers.authorization;
      let voterId: string;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          voterId = user.id;
        } else {
          // Fall back to anonymous voting
          voterId = generateVoterId(req);
        }
      } else {
        // Anonymous voting
        voterId = generateVoterId(req);
      }

      // Check if voter has voted for this article
      const { data: vote, error: voteError } = await supabase
        .from('news_votes')
        .select('id')
        .eq('article_id', articleId)
        .eq('voter_id', voterId)
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
