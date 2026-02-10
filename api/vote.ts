import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Generate anonymous voter ID from IP + User-Agent
 * This allows vote tracking without requiring authentication
 */
function generateVoterId(req: Request): string {
  const ip = req.headers['x-forwarded-for'] ||
             req.headers['x-real-ip'] ||
             req.socket?.remoteAddress ||
             'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Hash IP + User-Agent for privacy
  const hash = crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 32);

  return `anon_${hash}`;
}

export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST' || req.method === 'DELETE') {
    try {
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }

      // Check for authenticated user first
      const authHeader = req.headers.authorization;
      let voterId: string;
      let isAuthenticated = false;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);

        if (user) {
          voterId = user.id;
          isAuthenticated = true;
        } else {
          // Fall back to anonymous voting
          voterId = generateVoterId(req);
        }
      } else {
        // Anonymous voting
        voterId = generateVoterId(req);
      }

      // Verify article exists and check voting period status
      const { data: article, error: fetchError } = await supabase
        .from('news_articles')
        .select('id, upvote_count, voting_period_id')
        .eq('id', articleId)
        .single();

      if (fetchError || !article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Block votes on archived period articles
      if (article.voting_period_id) {
        const { data: period } = await supabase
          .from('voting_periods')
          .select('status')
          .eq('id', article.voting_period_id)
          .single();

        if (period && period.status !== 'active') {
          return res.status(403).json({
            success: false,
            error: 'Voting has ended for this article. This period has been archived.',
          });
        }
      }

      // Check if voter has already upvoted (use voter_id column for anon votes)
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('news_votes')
        .select('id')
        .eq('article_id', articleId)
        .eq('voter_id', voterId)
        .maybeSingle();

      if (voteCheckError) {
        console.error('Error checking existing vote:', voteCheckError);
        return res.status(500).json({
          success: false,
          error: 'Failed to check vote status',
        });
      }

      if (existingVote) {
        // Remove upvote (toggle behavior)
        const { error: deleteError } = await supabase
          .from('news_votes')
          .delete()
          .eq('article_id', articleId)
          .eq('voter_id', voterId);

        if (deleteError) {
          console.error('Error removing upvote:', deleteError);
          return res.status(500).json({
            success: false,
            error: 'Failed to remove upvote',
          });
        }

        // Get updated count (trigger will have updated it)
        const { data: updatedArticle } = await supabase
          .from('news_articles')
          .select('upvote_count, interest_score')
          .eq('id', articleId)
          .single();

        return res.status(200).json({
          success: true,
          action: 'removed',
          message: 'Upvote removed',
          data: {
            articleId,
            upvoteCount: updatedArticle?.upvote_count || 0,
            interestScore: updatedArticle?.interest_score || 50,
            hasUpvoted: false,
          },
        });
      } else {
        // Add upvote
        const { error: insertError } = await supabase
          .from('news_votes')
          .insert({
            article_id: articleId,
            voter_id: voterId,
            user_id: isAuthenticated ? voterId : null,
          });

        if (insertError) {
          console.error('Error adding upvote:', insertError);
          return res.status(500).json({
            success: false,
            error: 'Failed to add upvote',
          });
        }

        // Get updated count (trigger will have updated it)
        const { data: updatedArticle } = await supabase
          .from('news_articles')
          .select('upvote_count, interest_score')
          .eq('id', articleId)
          .single();

        return res.status(200).json({
          success: true,
          action: 'added',
          message: 'Upvote recorded',
          data: {
            articleId,
            upvoteCount: updatedArticle?.upvote_count || 1,
            interestScore: updatedArticle?.interest_score || 52,
            hasUpvoted: true,
          },
        });
      }
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
