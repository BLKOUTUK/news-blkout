# Newsroom Module: Comprehensive Improvement Plan

**Purpose**: Transform the newsroom from a static content display into an **engaging, interactive platform that drives habitual return** to the BLKOUT community platform.

**Status**: 🔴 Critical Issues Must Be Fixed Before Automation
**Target**: Vox-style layout with robust community engagement features
**Last Updated**: 2025-11-05

---

## Executive Summary

The newsroom module currently suffers from **critical functionality gaps** that prevent it from fulfilling its strategic purpose as a **daily engagement driver**. Before adding automated news aggregation (50-200 stories/day via RSS), these foundational issues must be resolved.

### Critical Issues Identified

1. ❌ **Upvoting System Non-Functional**: Votes not persisted to database
2. ❌ **No Link to Full Articles**: Clicking entries doesn't open source URLs
3. ❌ **Missing Social Media Integration**: No share buttons or tracking
4. ❌ **Poor Layout**: Not optimized for scanning/engagement (needs Vox-style cards)
5. ❌ **No "Story of the Month"**: Vote aggregation not working
6. ❌ **Low Engagement Design**: Static presentation, no community features visible

### Strategic Goal

**Transform newsroom into a habit-forming platform where users:**
- Return daily to see what's trending in Black QTIPOC+ news
- Engage through upvoting, commenting, and sharing
- Participate in weekly debates and monthly discussions
- Feel ownership over content curation through voting
- Discover new sources and perspectives
- Connect with community through shared interests

---

## Phase 1: Critical Fixes (MUST DO FIRST)

**Timeline**: 1-2 weeks
**Priority**: 🔴 BLOCKING - Must be completed before automation

### 1.1 Fix Upvoting System

**Current Problem**:
- Upvote buttons render but clicks do nothing
- No database writes occur
- No vote count updates
- No user tracking (can vote multiple times)

**Required Implementation**:

#### Database Schema Updates
```sql
-- Add upvotes tracking table
CREATE TABLE news_story_upvotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_story_id UUID REFERENCES news_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate votes
  UNIQUE(news_story_id, user_id)
);

-- Create index for vote counting
CREATE INDEX idx_news_story_upvotes_story_id ON news_story_upvotes(news_story_id);
CREATE INDEX idx_news_story_upvotes_user_id ON news_story_upvotes(user_id);

-- Update news_stories table
ALTER TABLE news_stories
ADD COLUMN upvote_count INT DEFAULT 0,
ADD COLUMN last_upvoted_at TIMESTAMP;

-- Create function to update upvote count
CREATE OR REPLACE FUNCTION update_news_story_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE news_stories
    SET
      upvote_count = upvote_count + 1,
      last_upvoted_at = NEW.created_at
    WHERE id = NEW.news_story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE news_stories
    SET upvote_count = GREATEST(0, upvote_count - 1)
    WHERE id = OLD.news_story_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER news_story_upvote_count_trigger
AFTER INSERT OR DELETE ON news_story_upvotes
FOR EACH ROW EXECUTE FUNCTION update_news_story_upvote_count();
```

#### Backend API Endpoints

**POST** `/api/news/:storyId/upvote`
```typescript
// src/api/newsVotingRoutes.ts
import { Request, Response } from 'express'
import { supabase } from '../utils/supabaseClient.js'

export async function upvoteStory(req: Request, res: Response) {
  const { storyId } = req.params
  const userId = req.user?.id // From auth middleware

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    // Check if already upvoted
    const { data: existingVote } = await supabase
      .from('news_story_upvotes')
      .select('id')
      .eq('news_story_id', storyId)
      .eq('user_id', userId)
      .single()

    if (existingVote) {
      // Remove upvote (toggle behavior)
      await supabase
        .from('news_story_upvotes')
        .delete()
        .eq('news_story_id', storyId)
        .eq('user_id', userId)

      return res.json({
        action: 'removed',
        message: 'Upvote removed'
      })
    }

    // Add upvote
    const { error } = await supabase
      .from('news_story_upvotes')
      .insert({
        news_story_id: storyId,
        user_id: userId
      })

    if (error) throw error

    // Get updated count
    const { data: story } = await supabase
      .from('news_stories')
      .select('upvote_count')
      .eq('id', storyId)
      .single()

    return res.json({
      action: 'added',
      upvote_count: story.upvote_count,
      message: 'Upvote recorded'
    })

  } catch (error) {
    console.error('Upvote error:', error)
    return res.status(500).json({ error: 'Failed to record upvote' })
  }
}

// GET /api/news/:storyId/user-vote
export async function getUserVote(req: Request, res: Response) {
  const { storyId } = req.params
  const userId = req.user?.id

  if (!userId) {
    return res.json({ hasUpvoted: false })
  }

  try {
    const { data } = await supabase
      .from('news_story_upvotes')
      .select('id')
      .eq('news_story_id', storyId)
      .eq('user_id', userId)
      .single()

    return res.json({ hasUpvoted: !!data })
  } catch (error) {
    return res.json({ hasUpvoted: false })
  }
}
```

#### Frontend Component Updates

```typescript
// NewsStoryCard.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowUpIcon } from '@heroicons/react/24/outline'
import { ArrowUpIcon as ArrowUpSolidIcon } from '@heroicons/react/24/solid'

interface NewsStoryCardProps {
  story: {
    id: string
    title: string
    description: string
    source_url: string
    source_name: string
    published_date: string
    upvote_count: number
    category: string
    image_url?: string
  }
}

export default function NewsStoryCard({ story }: NewsStoryCardProps) {
  const { user } = useAuth()
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(story.upvote_count)
  const [isLoading, setIsLoading] = useState(false)

  // Check if user has upvoted on mount
  useEffect(() => {
    if (user) {
      fetch(`/api/news/${story.id}/user-vote`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => setHasUpvoted(data.hasUpvoted))
        .catch(console.error)
    }
  }, [story.id, user])

  const handleUpvote = async () => {
    if (!user) {
      // Show login prompt
      alert('Please log in to upvote stories')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/news/${story.id}/upvote`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()

      if (data.action === 'added') {
        setHasUpvoted(true)
        setUpvoteCount(data.upvote_count)
      } else if (data.action === 'removed') {
        setHasUpvoted(false)
        setUpvoteCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Upvote error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="news-story-card">
      {/* Upvote button */}
      <button
        onClick={handleUpvote}
        disabled={isLoading}
        className={`upvote-btn ${hasUpvoted ? 'upvoted' : ''}`}
        aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote story'}
      >
        {hasUpvoted ? (
          <ArrowUpSolidIcon className="w-6 h-6 text-orange-500" />
        ) : (
          <ArrowUpIcon className="w-6 h-6 text-gray-400 hover:text-orange-500" />
        )}
        <span className="upvote-count">{upvoteCount}</span>
      </button>

      {/* Story content - see Section 1.2 for full implementation */}
    </div>
  )
}
```

**Success Criteria**:
- ✅ Users can upvote stories (authenticated)
- ✅ Upvotes persist to database
- ✅ Vote counts update in real-time
- ✅ Users cannot vote multiple times (enforced by DB)
- ✅ Toggle behavior: click again to remove vote
- ✅ Visual feedback: filled icon when upvoted

---

### 1.2 Fix Article Links

**Current Problem**:
- Clicking news entries does nothing
- No way to read full articles
- Poor UX: users expect clickable cards

**Required Implementation**:

```typescript
// NewsStoryCard.tsx (continued)
export default function NewsStoryCard({ story }: NewsStoryCardProps) {
  // ... upvote logic from above ...

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking upvote button or share buttons
    if ((e.target as HTMLElement).closest('.upvote-btn, .share-buttons')) {
      return
    }

    // Open in new tab
    window.open(story.source_url, '_blank', 'noopener,noreferrer')

    // Track click for analytics
    trackNewsClick(story.id, story.source_name)
  }

  return (
    <article
      className="news-story-card cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleCardClick}
    >
      {/* Image */}
      {story.image_url && (
        <div className="card-image">
          <img
            src={story.image_url}
            alt={story.title}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="card-content p-4">
        {/* Category badge */}
        <span className="category-badge">
          {story.category}
        </span>

        {/* Title */}
        <h3 className="text-lg font-semibold mt-2 mb-2 line-clamp-2">
          {story.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
          {story.description}
        </p>

        {/* Metadata footer */}
        <div className="card-footer flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="source-name font-medium">
              {story.source_name}
            </span>
            <span>•</span>
            <time>{formatRelativeTime(story.published_date)}</time>
          </div>

          {/* Upvote counter (visual only, button is separate) */}
          <div className="flex items-center gap-1">
            <ArrowUpIcon className="w-4 h-4" />
            <span>{upvoteCount}</span>
          </div>
        </div>
      </div>

      {/* Upvote button - positioned absolutely over card */}
      <div className="absolute top-4 left-4">
        <button
          onClick={handleUpvote}
          disabled={isLoading}
          className={`upvote-btn ${hasUpvoted ? 'upvoted' : ''}`}
        >
          {/* ... upvote UI from above ... */}
        </button>
      </div>
    </article>
  )
}
```

**Analytics Tracking**:
```typescript
// utils/analytics.ts
export function trackNewsClick(storyId: string, sourceName: string) {
  // Track click in database for "most clicked" metrics
  fetch('/api/news/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storyId, sourceName })
  }).catch(console.error)

  // Google Analytics (if configured)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'news_click', {
      story_id: storyId,
      source_name: sourceName
    })
  }
}
```

**Success Criteria**:
- ✅ Clicking anywhere on card opens article in new tab
- ✅ Upvote/share buttons don't trigger card click
- ✅ Opens in new tab (preserves BLKOUT session)
- ✅ Click tracking for analytics
- ✅ Hover states indicate clickability

---

### 1.3 Add Social Media Integration

**Current Problem**:
- No share buttons
- No social tracking
- Missed opportunity for viral distribution

**Required Implementation**:

#### Share Button Component
```typescript
// components/ShareButtons.tsx
import {
  TwitterIcon,
  FacebookIcon,
  LinkedInIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

interface ShareButtonsProps {
  story: {
    id: string
    title: string
    description: string
    source_url: string
  }
  className?: string
}

export default function ShareButtons({ story, className = '' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = story.source_url
  const shareText = `${story.title} - via @BLKOUTuk`

  const handleShare = (platform: string) => {
    let url = ''

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        break
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
        break
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        break
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
      trackShare(story.id, platform)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      trackShare(story.id, 'copy_link')
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }

  return (
    <div className={`share-buttons flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleShare('twitter')}
        className="share-btn twitter"
        aria-label="Share on Twitter"
      >
        <TwitterIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleShare('facebook')}
        className="share-btn facebook"
        aria-label="Share on Facebook"
      >
        <FacebookIcon className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleShare('linkedin')}
        className="share-btn linkedin"
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon className="w-5 h-5" />
      </button>

      <button
        onClick={handleCopyLink}
        className="share-btn copy-link"
        aria-label="Copy link"
      >
        {copied ? (
          <span className="text-xs">Copied!</span>
        ) : (
          <LinkIcon className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}

function trackShare(storyId: string, platform: string) {
  fetch('/api/news/track-share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storyId, platform })
  }).catch(console.error)
}
```

#### Database Tracking
```sql
-- Track shares for virality metrics
CREATE TABLE news_story_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_story_id UUID REFERENCES news_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL, -- twitter, facebook, linkedin, copy_link
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_story_shares_story_id ON news_story_shares(news_story_id);
CREATE INDEX idx_news_story_shares_platform ON news_story_shares(platform);

-- Add share count to news_stories
ALTER TABLE news_stories
ADD COLUMN share_count INT DEFAULT 0;

-- Update share count trigger
CREATE OR REPLACE FUNCTION update_news_story_share_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE news_stories
  SET share_count = share_count + 1
  WHERE id = NEW.news_story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER news_story_share_count_trigger
AFTER INSERT ON news_story_shares
FOR EACH ROW EXECUTE FUNCTION update_news_story_share_count();
```

**Success Criteria**:
- ✅ Share buttons on every news card
- ✅ Twitter, Facebook, LinkedIn integration
- ✅ Copy link functionality
- ✅ Share tracking in database
- ✅ Attribution to @BLKOUTuk on Twitter

---

### 1.4 Implement "Story of the Month"

**Current Problem**:
- No automated curation based on community engagement
- No spotlight feature for highly-engaged content

**Required Implementation**:

```typescript
// API endpoint to get top stories
// GET /api/news/top-stories?period=month&limit=1

export async function getTopStories(req: Request, res: Response) {
  const { period = 'month', limit = 10 } = req.query

  let dateFilter: string
  switch (period) {
    case 'day':
      dateFilter = "created_at >= NOW() - INTERVAL '1 day'"
      break
    case 'week':
      dateFilter = "created_at >= NOW() - INTERVAL '7 days'"
      break
    case 'month':
      dateFilter = "created_at >= NOW() - INTERVAL '30 days'"
      break
    default:
      dateFilter = "created_at >= NOW() - INTERVAL '30 days'"
  }

  try {
    // Weighted score: upvotes + (comments * 2) + (shares * 1.5)
    const { data, error } = await supabase
      .from('news_stories')
      .select(`
        *,
        discussion_threads (
          comment_count
        )
      `)
      .eq('moderation_status', 'auto-approved')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('upvote_count', { ascending: false })
      .limit(parseInt(limit as string))

    if (error) throw error

    // Calculate engagement scores
    const storiesWithScores = data.map(story => ({
      ...story,
      engagement_score:
        story.upvote_count +
        (story.discussion_threads?.comment_count || 0) * 2 +
        (story.share_count || 0) * 1.5
    }))

    // Sort by engagement score
    storiesWithScores.sort((a, b) => b.engagement_score - a.engagement_score)

    return res.json({
      period,
      top_stories: storiesWithScores
    })

  } catch (error) {
    console.error('Top stories error:', error)
    return res.status(500).json({ error: 'Failed to fetch top stories' })
  }
}
```

#### Frontend Display
```typescript
// components/StoryOfTheMonth.tsx
import { useEffect, useState } from 'react'
import { TrophyIcon } from '@heroicons/react/24/solid'

export default function StoryOfTheMonth() {
  const [topStory, setTopStory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/news/top-stories?period=month&limit=1')
      .then(res => res.json())
      .then(data => {
        setTopStory(data.top_stories[0])
        setLoading(false)
      })
      .catch(console.error)
  }, [])

  if (loading || !topStory) return null

  return (
    <section className="story-of-the-month bg-gradient-to-r from-orange-500 to-pink-500 p-8 rounded-lg text-white mb-8">
      <div className="flex items-center gap-3 mb-4">
        <TrophyIcon className="w-8 h-8" />
        <h2 className="text-2xl font-bold">Story of the Month</h2>
      </div>

      <article className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-2">
          {topStory.title}
        </h3>
        <p className="text-white/90 mb-4">
          {topStory.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span>{topStory.upvote_count} upvotes</span>
            <span>•</span>
            <span>{topStory.discussion_threads?.comment_count || 0} comments</span>
            <span>•</span>
            <span>{topStory.share_count || 0} shares</span>
          </div>

          <a
            href={topStory.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Read Full Story
          </a>
        </div>
      </article>
    </section>
  )
}
```

**Success Criteria**:
- ✅ Automated selection based on engagement score
- ✅ Prominent display at top of newsroom
- ✅ Updated daily (based on rolling 30-day window)
- ✅ Shows engagement metrics
- ✅ Links to full article

---

## Phase 2: Vox-Style Layout Redesign

**Timeline**: 1-2 weeks
**Priority**: 🟡 HIGH - Improves engagement and scannability

### 2.1 Design Principles (Vox-Inspired)

**Key Characteristics**:
1. **Card-based layout**: Each story is a distinct, scannable card
2. **Typography hierarchy**: Bold headlines, clear metadata
3. **Visual priority**: Featured images, category badges
4. **White space**: Generous padding, easy to scan
5. **Responsive grid**: 3 columns desktop, 2 tablet, 1 mobile
6. **Progressive disclosure**: Show essentials, hide details until hover/click

### 2.2 Layout Components

```typescript
// pages/Newsroom.tsx
import { useState, useEffect } from 'react'
import NewsStoryCard from '@/components/NewsStoryCard'
import StoryOfTheMonth from '@/components/StoryOfTheMonth'
import NewsFilters from '@/components/NewsFilters'
import TrendingStories from '@/components/TrendingStories'

export default function Newsroom() {
  const [stories, setStories] = useState([])
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'latest', // latest, trending, most-discussed
    timeRange: 'week' // day, week, month, all
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStories(filters)
  }, [filters])

  const fetchStories = async (filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: filters.category,
        sortBy: filters.sortBy,
        timeRange: filters.timeRange
      })

      const response = await fetch(`/api/news?${params}`)
      const data = await response.json()
      setStories(data.stories)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="newsroom-page max-w-7xl mx-auto px-4 py-8">
      {/* Hero: Story of the Month */}
      <StoryOfTheMonth />

      {/* Sidebar + Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar (1 column) */}
        <aside className="lg:col-span-1">
          {/* Filters */}
          <NewsFilters
            filters={filters}
            onChange={setFilters}
          />

          {/* Trending Stories (compact list) */}
          <TrendingStories className="mt-8" />
        </aside>

        {/* Main Content (3 columns) */}
        <main className="lg:col-span-3">
          {/* Active filters display */}
          <div className="filters-active mb-6">
            <h2 className="text-2xl font-bold mb-2">
              {filters.category === 'all' ? 'All Stories' : `${filters.category} Stories`}
            </h2>
            <p className="text-gray-600">
              Sorted by {filters.sortBy} • Last {filters.timeRange}
            </p>
          </div>

          {/* Story Grid */}
          {loading ? (
            <div className="loading-skeleton">Loading...</div>
          ) : (
            <div className="news-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {stories.map(story => (
                <NewsStoryCard key={story.id} story={story} />
              ))}
            </div>
          )}

          {/* Load More */}
          {stories.length >= 20 && (
            <button className="load-more-btn mt-8 w-full">
              Load More Stories
            </button>
          )}
        </main>
      </div>
    </div>
  )
}
```

### 2.3 Card Design System

```css
/* styles/newsroom.css */

/* Card Container */
.news-story-card {
  @apply bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl;
  @apply transition-all duration-300;
  @apply border border-gray-200;
  @apply relative;
  @apply cursor-pointer;
}

.news-story-card:hover {
  @apply transform -translate-y-1;
}

/* Card Image */
.card-image {
  @apply w-full h-48 overflow-hidden bg-gray-100;
}

.card-image img {
  @apply w-full h-full object-cover;
  @apply transition-transform duration-300;
}

.news-story-card:hover .card-image img {
  @apply scale-105;
}

/* Category Badge */
.category-badge {
  @apply inline-block px-3 py-1 text-xs font-semibold rounded-full;
  @apply bg-orange-100 text-orange-800;
}

.category-badge.activism {
  @apply bg-red-100 text-red-800;
}

.category-badge.culture {
  @apply bg-purple-100 text-purple-800;
}

.category-badge.policy {
  @apply bg-blue-100 text-blue-800;
}

.category-badge.local {
  @apply bg-green-100 text-green-800;
}

/* Upvote Button */
.upvote-btn {
  @apply flex flex-col items-center gap-1;
  @apply bg-white rounded-full px-3 py-2 shadow-md;
  @apply hover:shadow-lg transition-shadow;
  @apply border border-gray-200;
}

.upvote-btn.upvoted {
  @apply bg-orange-50 border-orange-500;
}

.upvote-count {
  @apply text-sm font-semibold;
  @apply text-gray-700;
}

.upvote-btn.upvoted .upvote-count {
  @apply text-orange-500;
}

/* Share Buttons */
.share-buttons {
  @apply opacity-0 transition-opacity;
}

.news-story-card:hover .share-buttons {
  @apply opacity-100;
}

.share-btn {
  @apply p-2 rounded-full transition-colors;
  @apply hover:bg-gray-100;
}

/* Typography */
.news-story-card h3 {
  @apply font-bold text-lg leading-tight;
  @apply text-gray-900;
}

.news-story-card p {
  @apply text-gray-600 text-sm leading-relaxed;
}

/* Grid Responsive */
.news-grid {
  @apply gap-6;
}

@media (min-width: 768px) {
  .news-grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1280px) {
  .news-grid {
    @apply grid-cols-3;
  }
}
```

**Success Criteria**:
- ✅ Card-based layout (3-column grid on desktop)
- ✅ Responsive design (mobile-first)
- ✅ Clear typography hierarchy
- ✅ Smooth hover interactions
- ✅ Fast loading with skeleton states
- ✅ Accessibility compliance (ARIA labels, keyboard navigation)

---

## Phase 3: Community Engagement Features

**Timeline**: 2-3 weeks
**Priority**: 🟢 MEDIUM-HIGH - Drives habitual return

### 3.1 Discussion Threads

**Purpose**: Transform every story into a conversation space

```sql
-- Comments table
CREATE TABLE news_story_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_story_id UUID REFERENCES news_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES news_story_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_news_comments_story_id ON news_story_comments(news_story_id);
CREATE INDEX idx_news_comments_parent_id ON news_story_comments(parent_comment_id);
CREATE INDEX idx_news_comments_user_id ON news_story_comments(user_id);

-- Update discussion_threads comment count
CREATE OR REPLACE FUNCTION update_discussion_thread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE discussion_threads
    SET
      comment_count = comment_count + 1,
      latest_comment_at = NEW.created_at
    WHERE news_story_id = NEW.news_story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE discussion_threads
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE news_story_id = OLD.news_story_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discussion_thread_count_trigger
AFTER INSERT OR DELETE ON news_story_comments
FOR EACH ROW EXECUTE FUNCTION update_discussion_thread_count();
```

#### Comment Component
```typescript
// components/CommentThread.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ChatBubbleLeftIcon, ArrowUpIcon } from '@heroicons/react/24/outline'

interface CommentThreadProps {
  storyId: string
  initialCount: number
}

export default function CommentThread({ storyId, initialCount }: CommentThreadProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isExpanded) {
      fetchComments()
    }
  }, [isExpanded])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/news/${storyId}/comments`)
      const data = await response.json()
      setComments(data.comments)
    } catch (error) {
      console.error('Fetch comments error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newComment.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/news/${storyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: newComment })
      })

      const data = await response.json()
      setComments([data.comment, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Submit comment error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="comment-thread mt-4 border-t pt-4">
      {/* Expand/collapse button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ChatBubbleLeftIcon className="w-5 h-5" />
        <span>{initialCount} {initialCount === 1 ? 'comment' : 'comments'}</span>
      </button>

      {/* Expanded thread */}
      {isExpanded && (
        <div className="mt-4">
          {/* Comment form */}
          {user ? (
            <form onSubmit={handleSubmit} className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500"
                rows={3}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="btn-primary mt-2"
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          ) : (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <a href="/login" className="text-orange-500 hover:underline">Log in</a>
                {' '}to join the discussion
              </p>
            </div>
          )}

          {/* Comments list */}
          <div className="comments-list space-y-4">
            {comments.map(comment => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Individual comment component
function Comment({ comment }) {
  return (
    <div className="comment bg-gray-50 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* User avatar */}
        <img
          src={comment.user.avatar_url || '/default-avatar.png'}
          alt={comment.user.display_name}
          className="w-10 h-10 rounded-full"
        />

        <div className="flex-1">
          {/* User name and timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">
              {comment.user.display_name}
            </span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          {/* Comment content */}
          <p className="text-sm text-gray-700">
            {comment.content}
          </p>

          {/* Comment actions */}
          <div className="flex items-center gap-4 mt-2">
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-orange-500">
              <ArrowUpIcon className="w-4 h-4" />
              <span>{comment.upvote_count}</span>
            </button>
            <button className="text-xs text-gray-500 hover:text-gray-700">
              Reply
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 3.2 Weekly Debate Topics

**Purpose**: Structured discussion prompts to drive engagement

```sql
-- Debate topics table
CREATE TABLE debate_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  participant_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_debate_topics_active ON debate_topics(is_active, start_date);

-- Debate responses
CREATE TABLE debate_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debate_topic_id UUID REFERENCES debate_topics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  position TEXT, -- agree, disagree, nuanced
  response TEXT NOT NULL,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Component
```typescript
// components/WeeklyDebate.tsx
export default function WeeklyDebate() {
  const [debate, setDebate] = useState(null)
  const [responses, setResponses] = useState([])
  const [userResponse, setUserResponse] = useState('')
  const [position, setPosition] = useState('nuanced')

  useEffect(() => {
    fetchActiveDebate()
  }, [])

  const fetchActiveDebate = async () => {
    const response = await fetch('/api/debates/active')
    const data = await response.json()
    setDebate(data.debate)
    setResponses(data.responses)
  }

  return (
    <section className="weekly-debate bg-gradient-to-r from-purple-600 to-pink-600 p-8 rounded-lg text-white mb-8">
      <h2 className="text-2xl font-bold mb-4">
        🗣️ This Week's Debate
      </h2>

      <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">
          {debate?.title}
        </h3>
        <p className="text-white/90 mb-4">
          {debate?.prompt}
        </p>

        {/* Response form */}
        <form onSubmit={handleSubmit} className="mt-6">
          {/* Position selector */}
          <div className="flex gap-2 mb-4">
            {['agree', 'disagree', 'nuanced'].map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => setPosition(pos)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  position === pos
                    ? 'bg-white text-purple-600'
                    : 'bg-white/20 text-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>

          <textarea
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="Share your perspective..."
            className="w-full border-0 rounded-lg p-4 text-gray-900"
            rows={4}
          />

          <button type="submit" className="btn-secondary mt-3">
            Submit Response
          </button>
        </form>

        {/* Responses count */}
        <div className="mt-6 text-sm text-white/80">
          {debate?.participant_count} people have shared their views
        </div>
      </div>
    </section>
  )
}
```

---

### 3.3 Trending & "Most Discussed" Sections

```typescript
// components/TrendingStories.tsx
export default function TrendingStories({ className = '' }: { className?: string }) {
  const [trending, setTrending] = useState([])

  useEffect(() => {
    fetch('/api/news/trending?limit=5')
      .then(res => res.json())
      .then(data => setTrending(data.stories))
      .catch(console.error)
  }, [])

  return (
    <div className={`trending-stories bg-white rounded-lg p-6 shadow-md ${className}`}>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        🔥 Trending Now
      </h3>

      <div className="space-y-4">
        {trending.map((story, index) => (
          <a
            key={story.id}
            href={story.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="trending-item block hover:bg-gray-50 p-3 rounded-lg transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl font-bold text-gray-300">
                {index + 1}
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-semibold line-clamp-2 mb-1">
                  {story.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{story.upvote_count} upvotes</span>
                  <span>•</span>
                  <span>{story.comment_count} comments</span>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
```

**Success Criteria**:
- ✅ Discussion threads on every story
- ✅ Weekly debate topics with structured prompts
- ✅ Trending stories sidebar (5 most upvoted in last 24h)
- ✅ Most discussed stories (7-day window)
- ✅ Comment upvoting
- ✅ Reply threading (nested comments)

---

## Phase 4: Advanced Features

**Timeline**: 2-3 weeks
**Priority**: 🟢 MEDIUM - "Nice to have" features

### 4.1 Personalization

- **Followed Sources**: Users can follow specific news sources
- **Category Preferences**: Remember user's preferred categories
- **Reading History**: Track read stories, suggest related content
- **Email Digests**: Weekly summary of top stories

### 4.2 Community Moderation

- **Report Button**: Flag inappropriate comments
- **Moderator Dashboard**: Review flagged content
- **Community Guidelines**: Clear rules for engagement
- **Ban/Timeout System**: Handle bad actors

### 4.3 Enhanced Analytics

```sql
-- Story engagement metrics
CREATE TABLE news_story_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_story_id UUID REFERENCES news_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  engagement_type TEXT NOT NULL, -- view, click, share, comment, upvote
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_engagement_story_id ON news_story_engagement(news_story_id);
CREATE INDEX idx_engagement_type ON news_story_engagement(engagement_type);
CREATE INDEX idx_engagement_date ON news_story_engagement(created_at);
```

### 4.4 Advanced Search & Filters

- **Full-text search**: Search story titles and descriptions
- **Multi-select categories**: Filter by multiple categories
- **Date range picker**: Custom time windows
- **Source filtering**: Show/hide specific sources
- **Saved searches**: Bookmark filter combinations

---

## Phase 5: Performance & UX Polish

**Timeline**: 1 week
**Priority**: 🟢 MEDIUM - Optimization

### 5.1 Performance Optimizations

- **Image optimization**: WebP format, lazy loading, srcset
- **Infinite scroll**: Load more stories without page reload
- **Skeleton loading states**: Smooth loading experience
- **Caching**: Cache API responses (SWR, React Query)
- **Code splitting**: Route-based lazy loading

### 5.2 Accessibility

- **Keyboard navigation**: Tab through stories, trigger actions
- **Screen reader support**: ARIA labels, semantic HTML
- **Color contrast**: WCAG AA compliance
- **Focus indicators**: Clear focus states
- **Skip links**: Jump to main content

### 5.3 Mobile Optimizations

- **Touch targets**: Minimum 44x44px buttons
- **Swipe gestures**: Swipe to dismiss, swipe to next story
- **Bottom navigation**: Fixed nav bar for key actions
- **Progressive Web App**: Install to home screen, offline support

---

## Implementation Roadmap

### Sprint 1 (Week 1-2): Critical Fixes
- [ ] Fix upvoting system (database + API + UI)
- [ ] Fix article links (clickable cards)
- [ ] Add social media share buttons
- [ ] Implement "Story of the Month"
- [ ] Basic analytics tracking

**Deliverable**: Functional newsroom with working upvotes, links, and shares

### Sprint 2 (Week 3-4): Vox-Style Layout
- [ ] Redesign card components
- [ ] Implement responsive grid
- [ ] Add filters sidebar
- [ ] Add trending stories section
- [ ] Typography and spacing polish

**Deliverable**: Beautiful, scannable newsroom layout

### Sprint 3 (Week 5-6): Community Features
- [ ] Discussion threads on stories
- [ ] Weekly debate topics
- [ ] Comment system with upvoting
- [ ] "Most Discussed" section
- [ ] User profiles for commenters

**Deliverable**: Interactive community platform

### Sprint 4 (Week 7-8): Advanced Features
- [ ] Personalization (followed sources, preferences)
- [ ] Advanced search and filters
- [ ] Email digests
- [ ] Moderation dashboard
- [ ] Enhanced analytics

**Deliverable**: Polished, feature-rich newsroom

### Sprint 5 (Week 9): Performance & Launch
- [ ] Performance optimizations
- [ ] Accessibility audit
- [ ] Mobile UX polish
- [ ] Load testing
- [ ] Launch prep and marketing

**Deliverable**: Production-ready newsroom at scale

---

## Success Metrics

### Engagement Metrics (Track Weekly)

**Primary KPIs**:
- **Daily Active Users (DAU)**: Target 500+ daily visits
- **Return Rate**: Target 40%+ users returning within 7 days
- **Time on Site**: Target 5+ minutes per session
- **Engagement Rate**: Target 30%+ users upvote/comment/share

**Secondary KPIs**:
- Stories per session: Target 8+ stories viewed
- Upvotes per user: Target 3+ upvotes per session
- Comment rate: Target 5%+ of users comment
- Share rate: Target 2%+ of users share

### Content Performance (Track Monthly)

- **Top 10 Stories**: Most upvoted stories of the month
- **Most Discussed**: Stories with most comments
- **Most Shared**: Viral stories on social media
- **Source Performance**: Which sources drive most engagement
- **Category Performance**: Which categories resonate most

### Community Health (Track Monthly)

- **Active Commenters**: Users who comment regularly
- **Debate Participation**: Weekly debate response rate
- **Moderation Queue Size**: Flagged content ratio
- **Positive Sentiment**: Comment tone analysis

### Technical Performance (Monitor Continuously)

- **Page Load Time**: Target <2s
- **API Response Time**: Target <200ms
- **Error Rate**: Target <0.1%
- **Uptime**: Target 99.9%

---

## Database Migration Plan

```sql
-- Run these migrations in order

-- Migration 1: Upvoting system
-- (See Section 1.1 for full schema)

-- Migration 2: Shares tracking
-- (See Section 1.3 for full schema)

-- Migration 3: Comments and discussions
-- (See Section 3.1 for full schema)

-- Migration 4: Debate topics
-- (See Section 3.2 for full schema)

-- Migration 5: Analytics and engagement
-- (See Section 4.3 for full schema)

-- Rollback plan: Keep backup before each migration
-- pg_dump -h $SUPABASE_HOST -U postgres -d postgres > backup_$(date +%Y%m%d).sql
```

---

## Risk Mitigation

### Technical Risks

**Risk**: Upvoting system performance at scale
- **Mitigation**: Use database triggers for count updates, cache aggregates

**Risk**: Comment spam and abuse
- **Mitigation**: Rate limiting, CAPTCHA, moderation queue, user reputation system

**Risk**: API rate limits (Supabase, social media)
- **Mitigation**: Implement caching, queueing, graceful degradation

### Product Risks

**Risk**: Low engagement despite features
- **Mitigation**: A/B test features, user research, iterate based on metrics

**Risk**: Feature bloat, overwhelming users
- **Mitigation**: Progressive disclosure, optional features, user testing

**Risk**: Moderation burden overwhelming admins
- **Mitigation**: Community moderation tools, automated filtering, clear guidelines

---

## Cost Analysis

### Development Time

- **Sprint 1-2 (Critical Fixes)**: 40-60 hours
- **Sprint 3-4 (Layout + Community)**: 60-80 hours
- **Sprint 5-6 (Advanced Features)**: 40-60 hours
- **Sprint 7 (Polish + Launch)**: 20-30 hours

**Total**: 160-230 hours (4-6 weeks full-time)

### Infrastructure Costs

- **Supabase**: Free tier sufficient (up to 500MB database, 2GB bandwidth)
- **IVOR Core**: Already deployed, no additional cost
- **CDN for images**: Cloudinary free tier (25GB storage, 25GB bandwidth)

**Monthly Cost**: $0 (using free tiers) or $5-10 (if upgrading for scale)

---

## Next Steps

### Immediate Actions (This Week)

1. **Review this plan with team**: Get buy-in and feedback
2. **Set up development environment**: Branch, local database, API keys
3. **Create database migrations**: Write SQL for upvoting system
4. **Design mockups**: Create Figma designs for Vox-style layout
5. **Start Sprint 1**: Begin implementing critical fixes

### Before Starting Automation

- ✅ Complete Sprint 1 (critical fixes)
- ✅ Complete Sprint 2 (layout redesign)
- ✅ Test with sample data (50-100 stories manually added)
- ✅ Validate engagement metrics baseline
- ✅ Ensure database can handle 200+ stories/day

**Only after these are complete**: Begin RSS automation from `automation/newsroom/README.md`

---

## Appendix: Design References

### Vox-Inspired Layouts

**Examples to study**:
- Vox.com homepage: Card grid, clear hierarchy
- Medium.com: Clean typography, excellent spacing
- The Verge: Visual-first cards, category badges
- Reddit: Upvoting UX patterns, comment threading

### Component Libraries

**Recommended**:
- **Headless UI**: Accessible components (dialogs, menus)
- **Heroicons**: Consistent icon set
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations

---

**Status**: Ready for implementation
**Owner**: Development team
**Timeline**: 6-8 weeks to full launch
**Blocker**: Must complete before RSS automation begins

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
