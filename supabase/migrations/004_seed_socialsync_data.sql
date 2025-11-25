-- Seed data for SocialSync Content Generation
-- Migration: 004_seed_socialsync_data.sql

-- Insert sample agent tasks
INSERT INTO agent_tasks (agent_type, title, description, priority, target_platform, suggested_config) VALUES
(
    'viral_trends',
    'Trending Audio Visualizer',
    'A trending audio clip is gaining traction. Create a dynamic visualizer.',
    'high',
    'tiktok',
    '{
        "mediaType": "video",
        "prompt": "Neon sound waves pulsating to the beat, dark background, energetic, abstract",
        "aspectRatio": "9:16",
        "style": "none",
        "videoStyle": "action",
        "overlayText": "SOUND ON 🔊"
    }'::jsonb
),
(
    'news_crawler',
    'Daily Tech Recap',
    'Summary graphic for today''s top 3 tech stories.',
    'medium',
    'linkedin',
    '{
        "mediaType": "image",
        "prompt": "Modern isometric tech illustration, server racks and cloud computing symbols, blue and white palette",
        "aspectRatio": "16:9",
        "style": "flat_design",
        "videoStyle": "none",
        "overlayText": "DAILY INSIGHTS"
    }'::jsonb
),
(
    'event_scheduler',
    'Webinar Countdown',
    'Promo material for "The Future of AI" webinar next Tuesday.',
    'low',
    'instagram',
    '{
        "mediaType": "video",
        "prompt": "Clock ticking, futuristic interface, countdown elements, smooth transition",
        "aspectRatio": "1:1",
        "style": "none",
        "videoStyle": "timelapse",
        "overlayText": "3 DAYS LEFT"
    }'::jsonb
),
(
    'brand_guardian',
    'Pride Month Campaign Asset',
    'Create vibrant pride-themed content for June campaign.',
    'high',
    'instagram',
    '{
        "mediaType": "image",
        "prompt": "Vibrant rainbow colors, Black LGBTQ+ community celebration, joyful atmosphere, professional photography style",
        "aspectRatio": "1:1",
        "style": "photorealistic",
        "videoStyle": "none",
        "overlayText": "PRIDE 2025"
    }'::jsonb
),
(
    'news_crawler',
    'Breaking News: Community Achievement',
    'Highlight recent community milestone achievement.',
    'high',
    'twitter',
    '{
        "mediaType": "image",
        "prompt": "Bold typography, celebration theme, modern design, inspiring message",
        "aspectRatio": "16:9",
        "style": "minimalist",
        "videoStyle": "none",
        "overlayText": "MAKING HISTORY"
    }'::jsonb
),
(
    'viral_trends',
    'Dance Challenge Participation',
    'Join the trending dance challenge with BLKOUT branding.',
    'medium',
    'tiktok',
    '{
        "mediaType": "video",
        "prompt": "Dynamic movement, urban setting, energetic vibe, professional cinematography",
        "aspectRatio": "9:16",
        "style": "none",
        "videoStyle": "action",
        "overlayText": "#BLKOUTChallenge"
    }'::jsonb
);

-- Note: We don't seed generated_assets or social_media_queue as these will be created by users
-- Note: We don't seed platform_credentials as these contain sensitive data

-- Create a view for pending tasks dashboard
CREATE OR REPLACE VIEW pending_tasks_dashboard AS
SELECT 
    id,
    agent_type,
    title,
    description,
    priority,
    target_platform,
    suggested_config,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_pending
FROM agent_tasks
WHERE status = 'pending'
ORDER BY 
    CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
    END,
    created_at ASC;

-- Create a view for asset library
CREATE OR REPLACE VIEW asset_library AS
SELECT 
    ga.id,
    ga.media_type,
    ga.url,
    ga.aspect_ratio,
    ga.style,
    ga.prompt,
    ga.overlay_text,
    ga.tags,
    ga.created_at,
    at.title as task_title,
    at.agent_type,
    at.target_platform,
    COUNT(smq.id) as times_published
FROM generated_assets ga
LEFT JOIN agent_tasks at ON ga.task_id = at.id
LEFT JOIN social_media_queue smq ON ga.id = smq.asset_id AND smq.status = 'published'
GROUP BY ga.id, at.title, at.agent_type, at.target_platform
ORDER BY ga.created_at DESC;

-- Create a view for publishing queue status
CREATE OR REPLACE VIEW publishing_queue_status AS
SELECT 
    smq.id,
    smq.platform,
    smq.status,
    smq.scheduled_for,
    smq.published_at,
    smq.caption,
    smq.error_message,
    ga.media_type,
    ga.url,
    ga.overlay_text,
    at.title as task_title
FROM social_media_queue smq
JOIN generated_assets ga ON smq.asset_id = ga.id
LEFT JOIN agent_tasks at ON ga.task_id = at.id
ORDER BY 
    CASE smq.status
        WHEN 'failed' THEN 1
        WHEN 'publishing' THEN 2
        WHEN 'queued' THEN 3
        WHEN 'scheduled' THEN 4
        WHEN 'published' THEN 5
    END,
    smq.scheduled_for ASC NULLS FIRST,
    smq.created_at DESC;

-- Grant view permissions
GRANT SELECT ON pending_tasks_dashboard TO anon, authenticated;
GRANT SELECT ON asset_library TO anon, authenticated;
GRANT SELECT ON publishing_queue_status TO anon, authenticated;

