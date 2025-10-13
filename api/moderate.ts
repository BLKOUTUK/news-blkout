import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
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
      const { action, itemId, item, edits } = req.body;

      if (action === 'edit') {
        // Build update object with only defined fields
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (edits.title !== undefined) updateData.title = edits.title;
        if (edits.excerpt !== undefined) updateData.excerpt = edits.excerpt;
        if (edits.content !== undefined) updateData.content = edits.content;
        if (edits.category !== undefined) updateData.category = edits.category;
        if (edits.url !== undefined) updateData.original_url = edits.url;

        console.log('Updating newsroom article:', itemId, updateData);

        // Update news_articles with edits
        const { error: updateError } = await supabase
          .from('news_articles')
          .update(updateData)
          .eq('id', itemId);

        if (updateError) {
          console.error('Edit error:', updateError);
          return res.status(500).json({
            success: false,
            error: updateError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article updated successfully',
        });
      }

      if (action === 'approve') {
        // Update news_articles to approved and published status
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({
            moderation_status: 'approved',
            status: 'published',
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (updateError) {
          console.error('Approve error:', updateError);
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
        // Update news_articles to rejected status (keep in database for audit)
        const { error: updateError } = await supabase
          .from('news_articles')
          .update({
            moderation_status: 'rejected',
            status: 'archived',
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (updateError) {
          console.error('Reject error:', updateError);
          return res.status(500).json({
            success: false,
            error: updateError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article rejected and archived',
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
