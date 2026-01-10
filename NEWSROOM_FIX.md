# News BLKOUT Empty Newsroom Fix

## Problem Summary

**Issue**: news.blkoutuk.cloud displays "BLKOUT Newsroom - Liberation News" header but shows NO articles.

**Root Cause**: API endpoint requires articles to have BOTH `published=true` AND `status='published'`, but database likely has:
- No articles at all, OR
- Articles with `status='review'` and `published=false` (default from fetch-news ingestion)

## Investigation Results

### Code Analysis

1. **Frontend Query** (`src/components/pages/NewsroomHome.tsx:41`):
   ```typescript
   const params = new URLSearchParams({
     status: 'published',  // ✅ Sends status parameter
     sortBy,
     limit: '20',
   });
   const response = await fetch(`/api/news?${params}`);
   ```

2. **API Endpoint** (`api/news.ts:31-36`):
   ```typescript
   let query = supabase
     .from('news_articles')
     .select('*')
     .eq('published', true)      // ⚠️ Requires published=true
     .eq('status', 'published')  // ⚠️ Requires status='published'
     .limit(parseInt(limit as string, 10));
   ```

3. **Article Ingestion** (`api/fetch-news.ts:343-363`):
   ```typescript
   const { error } = await supabase
     .from('news_articles')
     .insert({
       // ... fields ...
       status: 'review',        // ❌ Set to 'review' not 'published'
       published: false,        // ❌ Set to false not true
       moderation_status: 'pending',
     });
   ```

**The Mismatch**:
- Ingested articles have `status='review'` and `published=false`
- API requires `status='published'` AND `published=true`
- Result: Zero articles match the query → empty newsroom

## Solutions

### Option 1: Seed Database with Published Articles (RECOMMENDED)

Run the seeding script to add sample published articles:

```bash
cd /home/robbe/blkout-platform/apps/news-blkout

# Set environment variables
export SUPABASE_URL="your_supabase_project_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# Run diagnosis first
npx tsx scripts/diagnose-empty-newsroom.ts

# If diagnosis confirms no published articles, seed the database
npx tsx scripts/seed-published-articles.ts
```

**What this does**:
- Inserts 5 sample articles about UK Black LGBTQ+ community news
- Sets BOTH `published=true` AND `status='published'`
- Adds realistic content, images, and metadata
- Checks for duplicates before inserting

### Option 2: Update Existing Articles

If articles exist but aren't published, update them via SQL:

```sql
-- Update all 'review' articles to 'published'
UPDATE news_articles
SET
  published = true,
  status = 'published',
  moderation_status = 'approved',
  published_at = NOW()
WHERE status = 'review'
  AND moderation_status IN ('pending', 'auto-approved');
```

Run this in Supabase SQL Editor:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Paste and run the query above

### Option 3: Fetch Real News from RSS Feeds

Use the automated news fetching endpoint:

```bash
# Preview what would be fetched (GET request)
curl "https://news.blkoutuk.cloud/api/fetch-news?preview=true"

# Actually fetch and insert articles (POST request - requires auth)
curl -X POST "https://news.blkoutuk.cloud/api/fetch-news?manual=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Note**: This inserts articles with `status='review'` by default, so you'll need to run Option 2 SQL update afterward.

## Verification

After applying a solution, verify articles are showing:

```bash
# Check database directly
npx tsx scripts/diagnose-empty-newsroom.ts

# Check API endpoint
curl "https://news.blkoutuk.cloud/api/news?status=published&limit=5" | jq

# Visit the site
open https://news.blkoutuk.cloud
```

Expected result: Articles should be visible on the homepage.

## Prevention: Fix the Ingestion Pipeline

To prevent this issue in the future, update the fetch-news pipeline to publish articles automatically:

### Option A: Auto-publish high-quality articles

Edit `api/fetch-news.ts` line 359-360:

```typescript
// OLD (causes empty newsroom):
status: 'review',
published: false,

// NEW (auto-publish high-quality articles):
status: article.relevanceScore >= 80 ? 'published' : 'review',
published: article.relevanceScore >= 80,
```

### Option B: Create moderation dashboard

Build a simple admin UI to approve articles:
1. List articles with `status='review'`
2. Button to approve → sets `published=true, status='published'`
3. Button to reject → sets `status='archived'`

## Technical Details

### Database Schema

```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  excerpt TEXT,

  -- TWO fields that must BOTH be set for articles to show:
  published BOOLEAN DEFAULT false,        -- ⚠️ Must be true
  status TEXT DEFAULT 'draft',            -- ⚠️ Must be 'published'

  -- Other fields...
  category TEXT,
  author TEXT,
  source_url TEXT,
  interest_score INT DEFAULT 50,
  total_votes INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### API Query Logic

The API uses **both** filters to ensure only approved, published articles are shown:

```typescript
.eq('published', true)      // Boolean check: is article marked as published?
.eq('status', 'published')  // Status check: is article in published state?
```

This double-check is intentional for content moderation, but causes issues when:
- Articles are ingested with default values (review/false)
- No moderation workflow exists to promote articles to published

## Long-term Recommendations

1. **Create moderation workflow**: Build admin UI for approving articles
2. **Auto-approve trusted sources**: Configure high-quality RSS feeds to auto-publish
3. **Add monitoring**: Alert when newsroom has < 5 published articles
4. **Scheduled seeding**: Run weekly job to ensure minimum article count
5. **Fix fetch-news defaults**: Change default status based on source quality

## Related Files

- **Frontend**: `src/components/pages/NewsroomHome.tsx`
- **API**: `api/news.ts`, `api/fetch-news.ts`
- **Database**: `database/migration_003_news_automation.sql`
- **Scripts**: `scripts/seed-published-articles.ts`, `scripts/diagnose-empty-newsroom.ts`
- **Types**: `src/types/newsroom.ts`

## Support

If issues persist after following these steps:

1. Run diagnosis: `npx tsx scripts/diagnose-empty-newsroom.ts`
2. Check browser console for API errors
3. Verify Supabase RLS policies allow anonymous reads on `news_articles`
4. Confirm environment variables are set in Vercel production
