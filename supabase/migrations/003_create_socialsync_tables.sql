-- SocialSync Content Generation Tables
-- Migration: 003_create_socialsync_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE agent_type AS ENUM ('news_crawler', 'viral_trends', 'event_scheduler', 'brand_guardian');
CREATE TYPE task_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE social_platform AS ENUM ('instagram', 'tiktok', 'linkedin', 'twitter');
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE queue_status AS ENUM ('queued', 'scheduled', 'publishing', 'published', 'failed');

-- Agent Tasks Table
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_type agent_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    target_platform social_platform NOT NULL,
    suggested_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Generated Assets Table
CREATE TABLE generated_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
    media_type media_type NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    aspect_ratio TEXT,
    style TEXT,
    prompt TEXT NOT NULL,
    overlay_text TEXT,
    logo_id TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Media Queue Table
CREATE TABLE social_media_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES generated_assets(id) ON DELETE CASCADE,
    platform social_platform NOT NULL,
    status queue_status DEFAULT 'queued',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    platform_post_id TEXT,
    caption TEXT,
    hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform Credentials Table (encrypted)
CREATE TABLE platform_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform social_platform NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    account_id TEXT,
    account_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority);
CREATE INDEX idx_agent_tasks_created_at ON agent_tasks(created_at DESC);
CREATE INDEX idx_generated_assets_task_id ON generated_assets(task_id);
CREATE INDEX idx_generated_assets_created_at ON generated_assets(created_at DESC);
CREATE INDEX idx_social_queue_status ON social_media_queue(status);
CREATE INDEX idx_social_queue_platform ON social_media_queue(platform);
CREATE INDEX idx_social_queue_scheduled_for ON social_media_queue(scheduled_for);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_agent_tasks_updated_at BEFORE UPDATE ON agent_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_queue_updated_at BEFORE UPDATE ON social_media_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_credentials_updated_at BEFORE UPDATE ON platform_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_tasks
CREATE POLICY "Anyone can view agent tasks" ON agent_tasks
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create agent tasks" ON agent_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their assigned tasks" ON agent_tasks
    FOR UPDATE USING (assigned_to = auth.uid() OR auth.role() = 'service_role');

-- RLS Policies for generated_assets
CREATE POLICY "Anyone can view generated assets" ON generated_assets
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create assets" ON generated_assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own assets" ON generated_assets
    FOR UPDATE USING (created_by = auth.uid() OR auth.role() = 'service_role');

-- RLS Policies for social_media_queue
CREATE POLICY "Anyone can view social queue" ON social_media_queue
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add to queue" ON social_media_queue
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Service role can update queue" ON social_media_queue
    FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for platform_credentials (admin only)
CREATE POLICY "Only service role can access credentials" ON platform_credentials
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON agent_tasks TO anon, authenticated;
GRANT SELECT ON generated_assets TO anon, authenticated;
GRANT SELECT ON social_media_queue TO anon, authenticated;
GRANT INSERT, UPDATE ON agent_tasks TO authenticated;
GRANT INSERT, UPDATE ON generated_assets TO authenticated;
GRANT INSERT ON social_media_queue TO authenticated;

