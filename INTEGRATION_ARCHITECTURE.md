# SocialSync Integration Architecture

## Overview
This document outlines the integration architecture for SocialSync Content Generation Studio with the BLKOUT UK community content system, agents, and social media platforms.

## System Components

### 1. Frontend (SocialSync Studio)
- **Location**: `/packages/social-sync` or standalone module
- **Tech Stack**: React + TypeScript + Vite
- **Purpose**: AI content generation interface for content managers

### 2. Backend (Supabase)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for generated assets
- **Real-time**: Supabase Realtime for agent task updates

### 3. Agent System
- **News Crawler Bot**: Monitors news sources for Black LGBTQ+ content
- **Viral Trends Agent**: Tracks trending topics on social platforms
- **Event Scheduler**: Creates content requests for upcoming events
- **Brand Guardian**: Ensures brand compliance

### 4. Social Media Platforms
- Instagram
- TikTok
- LinkedIn
- X (Twitter)

## Database Schema

### Tables

#### `agent_tasks`
```sql
- id (uuid, primary key)
- agent_type (enum: news_crawler, viral_trends, event_scheduler, brand_guardian)
- title (text)
- description (text)
- priority (enum: high, medium, low)
- status (enum: pending, in_progress, completed, cancelled)
- target_platform (enum: instagram, tiktok, linkedin, twitter)
- suggested_config (jsonb)
- created_at (timestamp)
- updated_at (timestamp)
- completed_at (timestamp)
- assigned_to (uuid, foreign key to users)
```

#### `generated_assets`
```sql
- id (uuid, primary key)
- task_id (uuid, foreign key to agent_tasks)
- media_type (enum: image, video)
- url (text)
- storage_path (text)
- aspect_ratio (text)
- style (text)
- prompt (text)
- overlay_text (text)
- logo_id (text)
- tags (text[])
- metadata (jsonb)
- created_by (uuid, foreign key to users)
- created_at (timestamp)
```

#### `social_media_queue`
```sql
- id (uuid, primary key)
- asset_id (uuid, foreign key to generated_assets)
- platform (enum: instagram, tiktok, linkedin, twitter)
- status (enum: queued, scheduled, published, failed)
- scheduled_for (timestamp)
- published_at (timestamp)
- platform_post_id (text)
- caption (text)
- hashtags (text[])
- error_message (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### `platform_credentials`
```sql
- id (uuid, primary key)
- platform (enum: instagram, tiktok, linkedin, twitter)
- access_token (text, encrypted)
- refresh_token (text, encrypted)
- expires_at (timestamp)
- account_id (text)
- account_name (text)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

## API Endpoints

### Agent Tasks
- `GET /api/agent-tasks` - Fetch pending tasks
- `GET /api/agent-tasks/:id` - Get specific task
- `POST /api/agent-tasks` - Create new task (for agents)
- `PATCH /api/agent-tasks/:id` - Update task status
- `DELETE /api/agent-tasks/:id` - Cancel task

### Generated Assets
- `GET /api/assets` - List all generated assets
- `GET /api/assets/:id` - Get specific asset
- `POST /api/assets` - Create new asset record
- `PATCH /api/assets/:id` - Update asset metadata
- `DELETE /api/assets/:id` - Delete asset

### Social Media Queue
- `GET /api/social-queue` - List queued posts
- `POST /api/social-queue` - Add asset to publishing queue
- `PATCH /api/social-queue/:id` - Update queue item
- `DELETE /api/social-queue/:id` - Remove from queue

### Platform Integration
- `POST /api/platforms/:platform/publish` - Publish to specific platform
- `GET /api/platforms/:platform/status` - Check platform connection status
- `POST /api/platforms/:platform/auth` - OAuth callback handler

## Integration Flow

### 1. Agent Task Creation
```
Agent Bot → Supabase (agent_tasks table) → Real-time notification → SocialSync UI
```

### 2. Content Generation
```
User selects task → Configures settings → Google Gemini/Veo API → Asset generated → Supabase Storage
```

### 3. Asset Publishing
```
User clicks "Push to Automation" → social_media_queue table → Background worker → Platform API → Published
```

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google GenAI
GEMINI_API_KEY=your-gemini-api-key

# Social Media Platforms (Backend only)
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
```

## Next Steps
1. Create database migrations
2. Implement Supabase service layer
3. Update SocialSync integration service
4. Create social media platform connectors
5. Implement background job processor
6. Add authentication/authorization
7. Test end-to-end workflow

