# 🚨 QUICK FIX: Empty Newsroom on news.blkoutuk.cloud

## Problem
News site shows header but **NO articles** display.

## Root Cause
**Database has no articles** OR **articles not marked as published**.

API requires BOTH:
- `published = true` (boolean)
- `status = 'published'` (enum)

Likely state: Articles exist with `status='review'` and `published=false`.

---

## ⚡ Quick Fix (5 minutes)

### Step 1: Get Supabase Credentials

From Vercel dashboard:
1. Go to https://vercel.com/robs-projects-54d653d3/news-blkout
2. Settings → Environment Variables
3. Copy values for:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_ANON_KEY`)

### Step 2: Set Environment Variables

```bash
cd /home/robbe/blkout-platform/apps/news-blkout

export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 3: Diagnose Issue

```bash
npm run diagnose
```

This will show:
- Total articles in database
- Articles by status (draft/review/published)
- Articles by published boolean
- Articles matching API filters (what shows on site)

### Step 4: Apply Fix

**If diagnosis shows 0 articles**, seed the database:

```bash
npm run seed
```

**If diagnosis shows articles but 0 published**, update via SQL:

1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Paste and run:

```sql
UPDATE news_articles
SET
  published = true,
  status = 'published',
  published_at = NOW()
WHERE status = 'review';
```

### Step 5: Verify Fix

```bash
# Re-run diagnosis
npm run diagnose

# Should now show articles in "API query returns: X articles"
```

Visit https://news.blkoutuk.cloud - articles should now appear!

---

## 📋 What the Scripts Do

### `npm run diagnose`
- Checks total articles in database
- Shows breakdown by status and published state
- Tests the exact query the API uses
- Identifies root cause with recommendations

### `npm run seed`
- Inserts 5 sample UK Black LGBTQ+ news articles
- Sets BOTH `published=true` AND `status='published'`
- Adds realistic content, images, and metadata
- Prevents duplicates (safe to run multiple times)

---

## 🔍 Alternative: Direct Database Query

If npm scripts don't work, query Supabase directly:

### Check article count:
```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE published = true) as published_true,
  COUNT(*) FILTER (WHERE status = 'published') as status_published,
  COUNT(*) FILTER (WHERE published = true AND status = 'published') as both
FROM news_articles;
```

### Publish all review articles:
```sql
UPDATE news_articles
SET
  published = true,
  status = 'published',
  moderation_status = 'approved',
  published_at = NOW()
WHERE status = 'review';
```

---

## 📚 Full Documentation

See `NEWSROOM_FIX.md` for:
- Detailed root cause analysis
- Code explanations
- Long-term prevention strategies
- Troubleshooting steps

---

## ✅ Success Criteria

After fix, you should see:
1. ✅ `npm run diagnose` shows "API query returns: X articles" (X > 0)
2. ✅ news.blkoutuk.cloud displays article cards
3. ✅ Articles are clickable and show full content

---

## 🆘 Still Not Working?

1. **Check browser console** for API errors
2. **Verify environment variables** in Vercel production (not just preview)
3. **Check Supabase RLS policies** - ensure anonymous reads allowed on `news_articles`
4. **Test API directly**: Visit https://news.blkoutuk.cloud/api/news?status=published&limit=5
5. **Run diagnosis again**: `npm run diagnose`

---

## 🎯 Next Steps (Prevention)

1. **Build moderation UI** to approve articles from 'review' → 'published'
2. **Configure auto-publishing** for trusted RSS sources (relevanceScore >= 80)
3. **Set up monitoring** to alert when < 5 published articles
4. **Run weekly seeding job** to ensure minimum article count

---

**Questions?** See `NEWSROOM_FIX.md` or check the codebase at `/apps/news-blkout/`.
