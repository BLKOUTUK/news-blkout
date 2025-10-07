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
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'Article ID is required',
        });
      }

      // Get current article data
      const { data: article, error: fetchError } = await supabase
        .from('news_articles')
        .select('id, total_votes, interest_score')
        .eq('id', articleId)
        .single();

      if (fetchError || !article) {
        console.error('Error fetching article:', fetchError);
        return res.status(404).json({
          success: false,
          error: 'Article not found',
        });
      }

      // Increment vote count
      const newTotalVotes = (article.total_votes || 0) + 1;

      // Recalculate interest score based on votes
      // Formula: base score + (votes * vote_weight)
      const voteWeight = 2; // Each vote adds 2% to interest score
      const newInterestScore = Math.min(100, (article.interest_score || 50) + voteWeight);

      // Update article
      const { data: updatedArticle, error: updateError } = await supabase
        .from('news_articles')
        .update({
          total_votes: newTotalVotes,
          interest_score: newInterestScore,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating article:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update vote',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          articleId,
          totalVotes: newTotalVotes,
          interestScore: newInterestScore,
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
