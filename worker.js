/**
 * Background Worker for Social Media Publishing
 * 
 * This worker processes the social_media_queue table and publishes
 * assets to their respective social media platforms.
 * 
 * Usage:
 *   node worker.js
 * 
 * Environment Variables Required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY (not anon key!)
 *   - INSTAGRAM_CLIENT_ID
 *   - INSTAGRAM_CLIENT_SECRET
 *   - TIKTOK_CLIENT_KEY
 *   - TIKTOK_CLIENT_SECRET
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role key for full access
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Platform connectors (simplified for Node.js environment)
class PlatformPublisher {
    async publishToInstagram(asset, queueItem) {
        console.log(`[Instagram] Publishing asset ${asset.id}...`);
        
        // Get platform credentials
        const { data: creds } = await supabase
            .from('platform_credentials')
            .select('*')
            .eq('platform', 'instagram')
            .eq('is_active', true)
            .single();

        if (!creds) {
            throw new Error('Instagram credentials not found');
        }

        // Publish via Instagram Graph API
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${creds.account_id}/media`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_url: asset.url,
                    caption: queueItem.caption || '',
                    access_token: creds.access_token,
                }),
            }
        );

        const containerData = await response.json();

        // Publish the container
        const publishResponse = await fetch(
            `https://graph.facebook.com/v18.0/${creds.account_id}/media_publish`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creation_id: containerData.id,
                    access_token: creds.access_token,
                }),
            }
        );

        const publishData = await publishResponse.json();

        return {
            success: true,
            postId: publishData.id,
        };
    }

    async publishToTikTok(asset, queueItem) {
        console.log(`[TikTok] Publishing asset ${asset.id}...`);
        
        // Similar implementation for TikTok
        // ... TikTok API calls here
        
        return {
            success: true,
            postId: 'tiktok-post-id',
        };
    }

    async publish(platform, asset, queueItem) {
        switch (platform) {
            case 'instagram':
                return await this.publishToInstagram(asset, queueItem);
            case 'tiktok':
                return await this.publishToTikTok(asset, queueItem);
            default:
                throw new Error(`Platform ${platform} not supported`);
        }
    }
}

const publisher = new PlatformPublisher();

async function processQueue() {
    console.log('[Worker] Checking queue...');

    try {
        // Fetch queued items
        const { data: queueItems, error } = await supabase
            .from('social_media_queue')
            .select(`
                *,
                asset:generated_assets(*)
            `)
            .eq('status', 'queued')
            .is('scheduled_for', null) // Only process immediate posts
            .limit(10);

        if (error) {
            console.error('[Worker] Error fetching queue:', error);
            return;
        }

        if (!queueItems || queueItems.length === 0) {
            console.log('[Worker] No items in queue');
            return;
        }

        console.log(`[Worker] Processing ${queueItems.length} items...`);

        // Process each item
        for (const item of queueItems) {
            try {
                // Update status to publishing
                await supabase
                    .from('social_media_queue')
                    .update({ status: 'publishing' })
                    .eq('id', item.id);

                // Publish to platform
                const result = await publisher.publish(
                    item.platform,
                    item.asset,
                    item
                );

                // Update status to published
                await supabase
                    .from('social_media_queue')
                    .update({
                        status: 'published',
                        published_at: new Date().toISOString(),
                        platform_post_id: result.postId,
                    })
                    .eq('id', item.id);

                console.log(`[Worker] ✓ Published ${item.id} to ${item.platform}`);
            } catch (error) {
                console.error(`[Worker] ✗ Failed to publish ${item.id}:`, error);

                // Update status to failed
                await supabase
                    .from('social_media_queue')
                    .update({
                        status: 'failed',
                        error_message: error.message,
                        retry_count: item.retry_count + 1,
                    })
                    .eq('id', item.id);
            }
        }
    } catch (error) {
        console.error('[Worker] Fatal error:', error);
    }
}

// Run worker every minute
console.log('[Worker] Starting social media publishing worker...');
console.log('[Worker] Checking queue every 60 seconds');

setInterval(processQueue, 60000);

// Run immediately on start
processQueue();

