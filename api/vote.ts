import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

      // Get authorization header
      const authHeader = req.headers.authorization;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }

      // Check authentication
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please log in to upvote articles',
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verify token and get user
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication',
          message: 'Please log in to upvote articles',
        });
      }

      const userId = user.id;

      // Verify article exists
      const { data: article, error: fetchError } = await supabase
        .from('news_articles')
        .select('id, upvote_count')
        .eq('id', articleId)
        .single();

      if (fetchError || !article) {
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Check if user has already upvoted
      const { data: existingVote, error: voteCheckError } = await supabase
        .from('news_votes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', userId)
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
          .eq('user_id', userId);

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
            user_id: userId,
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
