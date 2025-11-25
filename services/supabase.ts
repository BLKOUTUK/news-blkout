import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Type definitions for database tables
export type AgentTask = Database['public']['Tables']['agent_tasks']['Row'];
export type AgentTaskInsert = Database['public']['Tables']['agent_tasks']['Insert'];
export type AgentTaskUpdate = Database['public']['Tables']['agent_tasks']['Update'];

export type GeneratedAsset = Database['public']['Tables']['generated_assets']['Row'];
export type GeneratedAssetInsert = Database['public']['Tables']['generated_assets']['Insert'];
export type GeneratedAssetUpdate = Database['public']['Tables']['generated_assets']['Update'];

export type SocialMediaQueue = Database['public']['Tables']['social_media_queue']['Row'];
export type SocialMediaQueueInsert = Database['public']['Tables']['social_media_queue']['Insert'];
export type SocialMediaQueueUpdate = Database['public']['Tables']['social_media_queue']['Update'];

/**
 * Fetch all pending agent tasks
 */
export async function fetchAgentTasks(): Promise<AgentTask[]> {
    const { data, error } = await supabase
        .from('agent_tasks')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching agent tasks:', error);
        throw error;
    }

    return data || [];
}

/**
 * Update agent task status
 */
export async function updateAgentTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    assignedTo?: string
): Promise<void> {
    const updates: AgentTaskUpdate = {
        status,
        updated_at: new Date().toISOString(),
    };

    if (assignedTo) {
        updates.assigned_to = assignedTo;
    }

    if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
        .from('agent_tasks')
        .update(updates)
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task status:', error);
        throw error;
    }
}

/**
 * Create a new generated asset record
 */
export async function createGeneratedAsset(asset: {
    taskId?: string;
    mediaType: 'image' | 'video';
    url: string;
    storagePath: string;
    aspectRatio: string;
    style: string;
    prompt: string;
    overlayText?: string;
    logoId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}): Promise<GeneratedAsset> {
    const { data: { user } } = await supabase.auth.getUser();

    const assetData: GeneratedAssetInsert = {
        task_id: asset.taskId || null,
        media_type: asset.mediaType,
        url: asset.url,
        storage_path: asset.storagePath,
        aspect_ratio: asset.aspectRatio,
        style: asset.style,
        prompt: asset.prompt,
        overlay_text: asset.overlayText || null,
        logo_id: asset.logoId || null,
        tags: asset.tags || [],
        metadata: asset.metadata || {},
        created_by: user?.id || null,
    };

    const { data, error } = await supabase
        .from('generated_assets')
        .insert(assetData)
        .select()
        .single();

    if (error) {
        console.error('Error creating generated asset:', error);
        throw error;
    }

    return data;
}

/**
 * Fetch all generated assets
 */
export async function fetchGeneratedAssets(): Promise<GeneratedAsset[]> {
    const { data, error } = await supabase
        .from('generated_assets')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching generated assets:', error);
        throw error;
    }

    return data || [];
}

/**
 * Add asset to social media publishing queue
 */
export async function addToPublishingQueue(
    assetId: string,
    platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter',
    caption?: string,
    hashtags?: string[],
    scheduledFor?: Date
): Promise<SocialMediaQueue> {
    const queueData: SocialMediaQueueInsert = {
        asset_id: assetId,
        platform,
        caption: caption || null,
        hashtags: hashtags || [],
        scheduled_for: scheduledFor?.toISOString() || null,
        status: 'queued',
    };

    const { data, error } = await supabase
        .from('social_media_queue')
        .insert(queueData)
        .select()
        .single();

    if (error) {
        console.error('Error adding to publishing queue:', error);
        throw error;
    }

    return data;
}

/**
 * Upload asset to Supabase Storage
 */
export async function uploadAssetToStorage(
    file: Blob,
    fileName: string,
    bucket: string = 'generated-assets'
): Promise<string> {
    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        console.error('Error uploading to storage:', error);
        throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}

/**
 * Subscribe to real-time agent task updates
 */
export function subscribeToAgentTasks(callback: (payload: any) => void) {
    return supabase
        .channel('agent_tasks_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'agent_tasks',
            },
            callback
        )
        .subscribe();
}

