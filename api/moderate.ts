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
        if (edits.url !== undefined) updateData.url = edits.url;

        // Preserve and merge content_data
        if (item.content_data) {
          updateData.content_data = {
            ...item.content_data,
            edited: {
              ...item.content_data?.edited,
              ...edits,
            },
          };
        }

        console.log('Updating moderation queue item:', itemId, updateData);

        // Update moderation queue item with edits
        const { error: updateError } = await supabase
          .from('moderation_queue')
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
        // Validate and map category to allowed values
        const allowedCategories = [
          'liberation', 'community', 'politics', 'culture',
          'economics', 'health', 'technology', 'opinion', 'analysis'
        ];
        const category = allowedCategories.includes(item.category)
          ? item.category
          : 'community';

        // Insert into news_articles
        const { error: insertError } = await supabase
          .from('news_articles')
          .insert([{
            title: item.title,
            excerpt: item.excerpt,
            content: item.excerpt || item.content || '',
            category: category,
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
        // Update news_articles status to rejected (keep in database)
        const { error: updateArticleError } = await supabase
          .from('news_articles')
          .update({
            status: 'rejected',
            published: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.content_data?.article_id);

        if (updateArticleError) {
          console.warn('Failed to update article status:', updateArticleError);
        }

        // Delete from moderation queue (remove from queue)
        const { error: deleteError } = await supabase
          .from('moderation_queue')
          .delete()
          .eq('id', itemId);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          return res.status(500).json({
            success: false,
            error: deleteError.message,
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Article rejected and removed from queue',
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
