import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
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
      const { action, itemId, item } = req.body;

      if (action === 'approve') {
        // Insert into news_articles
        const { error: insertError } = await supabase
          .from('news_articles')
          .insert([{
            title: item.title,
            excerpt: item.excerpt,
            content: item.excerpt || item.content || '',
            category: item.category || 'community',
            author: item.submitted_by || 'Community',
            source_url: item.url,
            source_name: 'Community Submission',
            status: 'published',
            published: true,
            published_at: new Date().toISOString(),
            interest_score: item.votes || 0,
            total_votes: item.votes || 0,
          }]);

        if (insertError) {
          console.error('Insert error:', insertError);
          return res.status(500).json({
            success: false,
            error: insertError.message,
          });
        }

        // Update moderation queue
        const { error: updateError } = await supabase
          .from('moderation_queue')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (updateError) {
          console.error('Update error:', updateError);
          return res.status(500).json({
            success: false,
            error: updateError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article approved and published',
        });
      }

      if (action === 'reject') {
        const { error } = await supabase
          .from('moderation_queue')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
            review_notes: 'Rejected by moderator',
          })
          .eq('id', itemId);

        if (error) {
          console.error('Reject error:', error);
          return res.status(500).json({
            success: false,
            error: error.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article rejected',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action',
      });
    } catch (error: any) {
      console.error('Moderation error:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error',
      });
    }
  }

  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
  });
}
