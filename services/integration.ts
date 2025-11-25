import { AgentTask, GeneratedAsset, SocialPlatform } from "../types";
import { MOCK_AGENT_TASKS } from "../constants";
import * as SupabaseService from './supabase';

// Integration service for connecting SocialSync with the BLKOUT ecosystem
// Uses Supabase for real-time data sync and storage

const USE_SUPABASE = !!import.meta.env.VITE_SUPABASE_URL;

/**
 * Fetch agent tasks from Supabase or fallback to mock data
 */
export const fetchAgentTasks = async (): Promise<AgentTask[]> => {
    if (USE_SUPABASE) {
        try {
            const tasks = await SupabaseService.fetchAgentTasks();

            // Transform Supabase tasks to match our AgentTask type
            return tasks.map(task => ({
                id: task.id,
                agentName: mapAgentType(task.agent_type),
                title: task.title,
                description: task.description || '',
                priority: task.priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
                timestamp: new Date(task.created_at).getTime(),
                targetPlatform: mapPlatform(task.target_platform),
                suggestedConfig: task.suggested_config as any,
            }));
        } catch (error) {
            console.error('[Integration Service] Error fetching from Supabase:', error);
            // Fallback to mock data
            return MOCK_AGENT_TASKS;
        }
    }

    // Simulate API latency for mock mode
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_AGENT_TASKS;
};

/**
 * Push generated asset to automation pipeline
 */
export const pushToAutomation = async (
    asset: GeneratedAsset,
    platform: SocialPlatform,
    caption?: string,
    hashtags?: string[]
): Promise<boolean> => {
    console.log(`[Integration Service] Pushing asset ${asset.id} to ${platform} automation pipeline...`);

    // Validate asset
    if (!asset.url) throw new Error("Asset URL is missing");

    if (USE_SUPABASE) {
        try {
            // First, ensure the asset is saved to the database
            let assetId = asset.id;

            // If asset doesn't have an ID, create it in the database
            if (!assetId || assetId.startsWith('asset-')) {
                const savedAsset = await SupabaseService.createGeneratedAsset({
                    mediaType: asset.mediaType === 'IMAGE' ? 'image' : 'video',
                    url: asset.url,
                    storagePath: asset.url, // In production, this would be the storage path
                    aspectRatio: asset.aspectRatio,
                    style: asset.style || '',
                    prompt: asset.prompt,
                    overlayText: asset.overlayText,
                    logoId: asset.logoAsset?.id,
                    tags: asset.tags,
                    metadata: {
                        provider: asset.provider,
                        resolution: asset.resolution,
                    },
                });
                assetId = savedAsset.id;
            }

            // Add to publishing queue
            await SupabaseService.addToPublishingQueue(
                assetId,
                mapPlatformToDb(platform),
                caption,
                hashtags
            );

            console.log(`[Integration Service] Successfully queued asset ${assetId} for ${platform}`);
            return true;
        } catch (error) {
            console.error('[Integration Service] Error pushing to Supabase:', error);
            throw error;
        }
    }

    // Simulate API upload and queueing for mock mode
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
};

/**
 * Check system health and connectivity
 */
export const checkSystemHealth = async (): Promise<boolean> => {
    if (USE_SUPABASE) {
        try {
            // Simple health check - try to fetch one task
            await SupabaseService.supabase.from('agent_tasks').select('id').limit(1);
            return true;
        } catch (error) {
            console.error('[Integration Service] Health check failed:', error);
            return false;
        }
    }

    // Simulate health check for mock mode
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
};

/**
 * Subscribe to real-time agent task updates
 */
export const subscribeToTaskUpdates = (callback: (tasks: AgentTask[]) => void) => {
    if (USE_SUPABASE) {
        return SupabaseService.subscribeToAgentTasks(async () => {
            // Refetch tasks when changes occur
            const tasks = await fetchAgentTasks();
            callback(tasks);
        });
    }
    return null;
};

// Helper functions to map between our types and Supabase types

function mapAgentType(dbType: string): any {
    const mapping: Record<string, string> = {
        'news_crawler': 'News Crawler Bot',
        'viral_trends': 'Viral Trends Agent',
        'event_scheduler': 'Event Scheduler',
        'brand_guardian': 'Brand Guardian',
    };
    return mapping[dbType] || dbType;
}

function mapPlatform(dbPlatform: string): SocialPlatform {
    const mapping: Record<string, SocialPlatform> = {
        'instagram': SocialPlatform.INSTAGRAM,
        'tiktok': SocialPlatform.TIKTOK,
        'linkedin': SocialPlatform.LINKEDIN,
        'twitter': SocialPlatform.TWITTER,
    };
    return mapping[dbPlatform] || SocialPlatform.INSTAGRAM;
}

function mapPlatformToDb(platform: SocialPlatform): 'instagram' | 'tiktok' | 'linkedin' | 'twitter' {
    const mapping: Record<SocialPlatform, 'instagram' | 'tiktok' | 'linkedin' | 'twitter'> = {
        [SocialPlatform.INSTAGRAM]: 'instagram',
        [SocialPlatform.TIKTOK]: 'tiktok',
        [SocialPlatform.LINKEDIN]: 'linkedin',
        [SocialPlatform.TWITTER]: 'twitter',
    };
    return mapping[platform];
}
