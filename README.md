# BLKOUT Newsroom 🏴‍☠️

> Community-curated news for Black queer liberation. Stories that matter, selected by us, for us.

## 🌟 Overview

BLKOUT Newsroom is a dedicated news curation platform that's part of the BLKOUT Liberation Platform ecosystem. Built with the same liberation values and community-first approach, it enables democratic news curation and discovery.

### Key Features

- **Community Curation**: Members submit and vote on stories that matter
- **IVOR Learning**: AI learns from community preferences to discover relevant stories
- **Liberation Focus**: News that centers Black queer liberation and community power
- **Democratic Governance**: Community votes shape the news agenda
- **Weekly Highlights**: Featured "Story of the Week" based on community engagement

## 🏛️ Architecture

```
news-blkout/
├── src/
│   ├── components/
│   │   ├── pages/           # NewsroomHome, ArticleDetail
│   │   ├── ui/              # Reusable UI components
│   │   └── forms/           # Form components
│   ├── lib/                 # Utilities and Supabase client
│   ├── services/            # API services
│   └── types/               # TypeScript types
├── api/                     # Vercel serverless functions
│   ├── news.ts             # Article listing API
│   ├── news/[id].ts        # Single article API
│   └── newsletter/         # Newsletter subscription
├── database/               # Supabase schema
└── public/                 # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd news-blkout

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3001` to see the newsroom in action.

### Database Setup

1. Create a new Supabase project
2. Run the schema from `database/schema.sql` in the Supabase SQL editor
3. Update your `.env` file with Supabase credentials

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ENV=development
VITE_API_URL=/api
```

### Vercel Deployment

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Deploy! Vercel will automatically build and deploy

Expected deployment URL: `news-blkout.vercel.app`

## 📊 Database Schema

### Main Tables

- **newsroom_articles**: Curated news articles with community engagement data
- **newsroom_votes**: Community votes on article interest/relevance
- **newsroom_writers**: Writer profiles and contributions
- **newsletter_subscriptions**: Newsletter subscriber management
- **newsroom_analytics**: Article engagement tracking

See `database/schema.sql` for complete schema with indexes and RLS policies.

## 🎨 Design System

### Colors

```typescript
liberation-black-power: #000000
liberation-gold-divine: #FFD700
liberation-sovereignty-gold: #D4AF37
liberation-pride-purple: #9B4DCA
liberation-community-teal: #00CED1
liberation-resistance-red: #DC143C
liberation-healing-green: #2E8B57
```

### Typography

- Headings: Space Grotesk
- Body: Inter

## 🔌 API Endpoints

### GET /api/news

Fetch articles with filtering and sorting.

**Query Parameters:**
- `category`: Filter by category (optional)
- `sortBy`: `interest` | `recent` | `weekly`
- `status`: `published` (default)
- `limit`: Number of articles to return

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [...],
    "total": 20
  }
}
```

### GET /api/news/[id]

Fetch a single article by ID.

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### POST /api/newsletter/subscribe

Subscribe to newsletter.

**Request Body:**
```json
{
  "email": "user@example.com",
  "frequency": "weekly",
  "categories": []
}
```

## 🏴‍☠️ Liberation Values

This newsroom module embodies BLKOUT's core values:

- **75% Creator Sovereignty**: Content creators maintain majority control
- **Democratic Governance**: Community votes shape the news agenda
- **Anti-Oppression UX**: Trauma-informed, accessible design
- **Community Data Sovereignty**: User data controlled by community
- **Black Queer Joy**: Celebration of Black queer culture and liberation

## 📝 Development Guidelines

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting (follow platform standards)
- Accessibility-first (WCAG 3.0 Bronze minimum)

### Component Structure

```typescript
// Use functional components with TypeScript
import React from 'react';
import type { ComponentProps } from '@/types';

const MyComponent: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  return <div>...</div>;
};

export default MyComponent;
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## 🔗 Integration with Platform

The newsroom integrates with the main BLKOUT platform:

- Shared design system and liberation colors
- Cross-linking with main platform (`blkout.vercel.app`)
- Unified Supabase backend
- Consistent authentication (when implemented)

## 🤝 Contributing

We welcome contributions that align with our liberation values!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the BLKOUT Liberation Platform and operates under the same community liberation license.

## 🙏 Acknowledgments

- Built by the BLKOUT community
- Powered by liberation values
- Inspired by Vox, The Guardian, and community journalism

---

**Made with ❤️ by the BLKOUT Community**

*Liberation through technology. Community through curation.*
