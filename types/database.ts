export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agent_tasks: {
        Row: {
          id: string
          agent_type: 'news_crawler' | 'viral_trends' | 'event_scheduler' | 'brand_guardian'
          title: string
          description: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          target_platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          suggested_config: Json
          created_at: string
          updated_at: string
          completed_at: string | null
          assigned_to: string | null
        }
        Insert: {
          id?: string
          agent_type: 'news_crawler' | 'viral_trends' | 'event_scheduler' | 'brand_guardian'
          title: string
          description?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          target_platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          suggested_config?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          assigned_to?: string | null
        }
        Update: {
          id?: string
          agent_type?: 'news_crawler' | 'viral_trends' | 'event_scheduler' | 'brand_guardian'
          title?: string
          description?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          target_platform?: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          suggested_config?: Json
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          assigned_to?: string | null
        }
      }
      generated_assets: {
        Row: {
          id: string
          task_id: string | null
          media_type: 'image' | 'video'
          url: string
          storage_path: string
          aspect_ratio: string | null
          style: string | null
          prompt: string
          overlay_text: string | null
          logo_id: string | null
          tags: string[]
          metadata: Json
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id?: string | null
          media_type: 'image' | 'video'
          url: string
          storage_path: string
          aspect_ratio?: string | null
          style?: string | null
          prompt: string
          overlay_text?: string | null
          logo_id?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string | null
          media_type?: 'image' | 'video'
          url?: string
          storage_path?: string
          aspect_ratio?: string | null
          style?: string | null
          prompt?: string
          overlay_text?: string | null
          logo_id?: string | null
          tags?: string[]
          metadata?: Json
          created_by?: string | null
          created_at?: string
        }
      }
      social_media_queue: {
        Row: {
          id: string
          asset_id: string | null
          platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          status: 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed'
          scheduled_for: string | null
          published_at: string | null
          platform_post_id: string | null
          caption: string | null
          hashtags: string[]
          error_message: string | null
          retry_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          asset_id?: string | null
          platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          status?: 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed'
          scheduled_for?: string | null
          published_at?: string | null
          platform_post_id?: string | null
          caption?: string | null
          hashtags?: string[]
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          asset_id?: string | null
          platform?: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          status?: 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed'
          scheduled_for?: string | null
          published_at?: string | null
          platform_post_id?: string | null
          caption?: string | null
          hashtags?: string[]
          error_message?: string | null
          retry_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      platform_credentials: {
        Row: {
          id: string
          platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          account_id: string | null
          account_name: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          platform?: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      pending_tasks_dashboard: {
        Row: {
          id: string
          agent_type: string
          title: string
          description: string | null
          priority: string
          target_platform: string
          suggested_config: Json
          created_at: string
          hours_pending: number
        }
      }
      asset_library: {
        Row: {
          id: string
          media_type: string
          url: string
          aspect_ratio: string | null
          style: string | null
          prompt: string
          overlay_text: string | null
          tags: string[]
          created_at: string
          task_title: string | null
          agent_type: string | null
          target_platform: string | null
          times_published: number
        }
      }
      publishing_queue_status: {
        Row: {
          id: string
          platform: string
          status: string
          scheduled_for: string | null
          published_at: string | null
          caption: string | null
          error_message: string | null
          media_type: string
          url: string
          overlay_text: string | null
          task_title: string | null
        }
      }
    }
    Functions: {}
    Enums: {
      agent_type: 'news_crawler' | 'viral_trends' | 'event_scheduler' | 'brand_guardian'
      task_priority: 'high' | 'medium' | 'low'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      social_platform: 'instagram' | 'tiktok' | 'linkedin' | 'twitter'
      media_type: 'image' | 'video'
      queue_status: 'queued' | 'scheduled' | 'publishing' | 'published' | 'failed'
    }
  }
}

