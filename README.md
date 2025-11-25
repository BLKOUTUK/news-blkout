
# SocialSync Content Generation

**Package:** `@blkoutuk/social-sync`
**Integration:** BLKOUT UK Communications Ecosystem
**Status:** Production Ready

## Overview

SocialSync is an AI-powered content generation studio that seamlessly integrates with the BLKOUT UK community content system, automation agents, and social media platforms. It empowers content teams to generate high-fidelity images and video assets tailored for social media campaigns with full backend integration.

The system operates as a "Headless Studio," consuming tasks from automated agents (News Crawlers, Viral Trends Bots, Event Schedulers) and publishing generated assets directly to social media platforms via a robust automation pipeline.

## Key Features

-   **Multi-Model AI Support:** Leverages Google Gemini 3 Pro for imagery and Veo 3.1 for video generation
-   **Full Backend Integration:** Real-time sync with Supabase for task management and asset storage
-   **Agent System:** Receives structured tasks from automated background agents
-   **Social Media Publishing:** Direct publishing to Instagram, TikTok, LinkedIn, and Twitter/X
-   **Brand Compliance:** Enforces aspect ratios, logo overlays, and specific visual styles
-   **Real-time Updates:** Live task notifications via Supabase Realtime
-   **Asset Library:** Centralized storage and management of all generated content

## Tech Stack

-   **Frontend:** React + TypeScript + Vite
-   **Backend:** Supabase (PostgreSQL + Real-time + Storage)
-   **AI Services:** Google GenAI SDK (`@google/genai`)
-   **Social APIs:** Instagram Graph API, TikTok Content Posting API
-   **Styling:** Tailwind CSS

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env` file:

```env
# Google GenAI (Required)
GEMINI_API_KEY=your_google_genai_api_key

# Supabase (Required for production)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Social Media Platforms (Optional)
VITE_INSTAGRAM_CLIENT_ID=your_instagram_client_id
VITE_INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key
VITE_TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

### 3. Set Up Database

Run the Supabase migrations:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL files in `supabase/migrations/` in order.

### 4. Run Development Server

```bash
npm start
```

The app will run on `http://localhost:3000`

## Integration with BLKOUT Ecosystem

### Agent System Integration

Automation agents can create content tasks by inserting into the `agent_tasks` table:

```typescript
import { supabase } from './services/supabase';

await supabase.from('agent_tasks').insert({
    agent_type: 'news_crawler',
    title: 'Breaking News Visual',
    description: 'Create graphic for community achievement',
    priority: 'high',
    target_platform: 'instagram',
    suggested_config: {
        mediaType: 'image',
        prompt: 'Bold typography, celebration theme',
        aspectRatio: '1:1',
        style: 'photorealistic',
        overlayText: 'MAKING HISTORY'
    }
});
```

### Publishing Workflow

1. **Task Creation:** Agents create tasks in `agent_tasks` table
2. **Real-time Sync:** SocialSync UI receives tasks via Supabase Realtime
3. **Content Generation:** Users generate assets using Google Gemini/Veo
4. **Asset Storage:** Generated content saved to Supabase Storage
5. **Queue Management:** Assets added to `social_media_queue` table
6. **Platform Publishing:** Background worker publishes to social platforms
7. **Status Updates:** Queue status updated in real-time

## Database Schema

### Core Tables

-   **agent_tasks:** Tasks created by automation agents
-   **generated_assets:** AI-generated images and videos
-   **social_media_queue:** Publishing queue for social platforms
-   **platform_credentials:** OAuth tokens for social media accounts

### Useful Views

-   **pending_tasks_dashboard:** All pending tasks sorted by priority
-   **asset_library:** All generated assets with metadata
-   **publishing_queue_status:** Current publishing queue status

## Social Media Platform Support

### Supported Platforms

-   ✅ **Instagram:** Images and videos via Graph API
-   ✅ **TikTok:** Videos via Content Posting API
-   🚧 **LinkedIn:** Coming soon
-   🚧 **Twitter/X:** Coming soon

### Platform Requirements

Each platform has specific media requirements:

-   **Instagram:** Images (4:5 to 1.91:1), Videos (9:16 to 1.91:1)
-   **TikTok:** Videos only (9:16 preferred)
-   **LinkedIn:** Images and videos (16:9 recommended)
-   **Twitter/X:** Images and videos (various ratios)

## Documentation

-   **[Integration Guide](./INTEGRATION_GUIDE.md):** Detailed setup and integration instructions
-   **[Architecture](./INTEGRATION_ARCHITECTURE.md):** System architecture and design decisions
-   **[API Reference](./docs/API.md):** API endpoints and data models (coming soon)

## Development

### Project Structure

```
socialsync-content-generation/
├── services/
│   ├── supabase.ts          # Supabase client and database operations
│   ├── integration.ts        # Integration with BLKOUT ecosystem
│   ├── genai.ts             # Google GenAI service
│   └── platforms/           # Social media platform connectors
│       ├── base.ts          # Base platform interface
│       ├── instagram.ts     # Instagram connector
│       ├── tiktok.ts        # TikTok connector
│       └── index.ts         # Platform manager
├── supabase/
│   └── migrations/          # Database migrations
├── types/
│   ├── database.ts          # Supabase database types
│   └── index.ts             # Application types
└── components/              # React components
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

## Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

### Database (Supabase)

1. Create Supabase project
2. Run migrations
3. Configure storage bucket and policies

### Background Worker (Optional)

Deploy a Node.js worker for automated publishing:

```bash
node worker.js
```

See `INTEGRATION_GUIDE.md` for worker implementation details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions, contact the BLKOUT UK development team or open an issue on GitHub.

## License

UNLICENSED - Proprietary software for BLKOUT UK
