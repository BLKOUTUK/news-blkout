# SocialSync Integration Guide

## Overview
This guide explains how to integrate SocialSync Content Generation Studio with the BLKOUT UK community content system, agents, and social media platforms.

## Architecture

### System Components
1. **Frontend**: React + TypeScript + Vite (SocialSync Studio)
2. **Backend**: Supabase (PostgreSQL + Real-time + Storage)
3. **AI Services**: Google Gemini (images) + Veo (videos)
4. **Social Platforms**: Instagram, TikTok, LinkedIn, Twitter/X

### Data Flow
```
Agent Bots → Supabase (agent_tasks) → SocialSync UI → Google GenAI → 
Generated Assets → Supabase Storage → Social Media Queue → Platform APIs → Published
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd socialsync-content-generation
npm install
```

### 2. Set Up Supabase

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL files in order:
1. `supabase/migrations/003_create_socialsync_tables.sql`
2. `supabase/migrations/004_seed_socialsync_data.sql`

#### Create Storage Bucket
```sql
-- In Supabase SQL Editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-assets', 'generated-assets', true);

-- Set storage policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'generated-assets');

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'generated-assets' AND auth.role() = 'authenticated');
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
# Google GenAI
GEMINI_API_KEY=your_google_genai_api_key

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Social Media Platforms (Optional - for direct publishing)
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
VITE_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### 4. Run the Application

```bash
npm start
```

The app will run on `http://localhost:3000`

## Integration with Existing Systems

### Agent System Integration

Agents can create tasks by inserting into the `agent_tasks` table:

```typescript
import { supabase } from './services/supabase';

// Example: News Crawler Bot creates a task
await supabase.from('agent_tasks').insert({
    agent_type: 'news_crawler',
    title: 'Breaking News: Community Achievement',
    description: 'Create visual for recent milestone',
    priority: 'high',
    target_platform: 'instagram',
    suggested_config: {
        mediaType: 'image',
        prompt: 'Celebration theme, bold typography, inspiring',
        aspectRatio: '1:1',
        style: 'photorealistic',
        overlayText: 'MAKING HISTORY'
    }
});
```

### Real-time Updates

SocialSync automatically subscribes to task updates:

```typescript
import { subscribeToTaskUpdates } from './services/integration';

// In your component
useEffect(() => {
    const subscription = subscribeToTaskUpdates((tasks) => {
        console.log('New tasks received:', tasks);
        setAgentTasks(tasks);
    });

    return () => subscription?.unsubscribe();
}, []);
```

### Publishing Workflow

When users click "Push to Automation":

1. Asset is saved to Supabase Storage
2. Record created in `generated_assets` table
3. Entry added to `social_media_queue` table
4. Background worker picks up queued items
5. Platform API publishes content
6. Queue status updated to 'published'

## Social Media Platform Setup

### Instagram

1. Create a Facebook App at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Basic Display and Instagram Graph API products
3. Configure OAuth redirect URI: `https://your-domain.com/auth/callback`
4. Copy Client ID and Client Secret to `.env`

### TikTok

1. Register at [developers.tiktok.com](https://developers.tiktok.com)
2. Create an app and enable Content Posting API
3. Configure redirect URI
4. Copy Client Key and Client Secret to `.env`

### LinkedIn & Twitter

Similar OAuth setup required. Connectors can be implemented following the same pattern as Instagram/TikTok.

## Database Schema

### Key Tables

- **agent_tasks**: Tasks created by automation agents
- **generated_assets**: AI-generated images and videos
- **social_media_queue**: Publishing queue for social platforms
- **platform_credentials**: OAuth tokens (encrypted)

### Useful Views

- **pending_tasks_dashboard**: All pending tasks sorted by priority
- **asset_library**: All generated assets with metadata
- **publishing_queue_status**: Current publishing queue status

## API Endpoints (Future Backend Service)

If you need a REST API layer:

```
GET    /api/agent-tasks          - Fetch pending tasks
POST   /api/agent-tasks          - Create new task
PATCH  /api/agent-tasks/:id      - Update task status
POST   /api/assets               - Save generated asset
POST   /api/social-queue         - Add to publishing queue
POST   /api/platforms/:platform/publish - Publish to platform
```

## Deployment

### Frontend (Vercel/Netlify)

```bash
npm run build
# Deploy the 'dist' folder
```

### Database (Supabase)

Already hosted - just run migrations

### Background Workers

For automated publishing, deploy a Node.js worker:

```typescript
// worker.ts
import { supabase } from './supabase';
import { platformManager } from './services/platforms';

setInterval(async () => {
    const { data: queue } = await supabase
        .from('social_media_queue')
        .select('*')
        .eq('status', 'queued')
        .limit(10);

    for (const item of queue || []) {
        const result = await platformManager.publish(
            item.platform,
            item.asset.url,
            item.asset.media_type,
            { caption: item.caption, hashtags: item.hashtags }
        );

        await supabase
            .from('social_media_queue')
            .update({
                status: result.success ? 'published' : 'failed',
                published_at: result.success ? new Date().toISOString() : null,
                error_message: result.error,
            })
            .eq('id', item.id);
    }
}, 60000); // Run every minute
```

## Troubleshooting

### "No tasks showing up"
- Check Supabase connection
- Verify migrations ran successfully
- Check browser console for errors

### "Can't publish to social media"
- Verify platform credentials are set
- Check OAuth tokens haven't expired
- Review platform API rate limits

### "Assets not uploading"
- Check Supabase storage bucket exists
- Verify storage policies are set
- Check file size limits

## Next Steps

1. ✅ Database migrations created
2. ✅ Supabase service layer implemented
3. ✅ Social media platform connectors created
4. ⏳ Deploy to production
5. ⏳ Set up background publishing worker
6. ⏳ Configure OAuth for social platforms
7. ⏳ Test end-to-end workflow

## Support

For issues or questions, contact the BLKOUT UK development team.

