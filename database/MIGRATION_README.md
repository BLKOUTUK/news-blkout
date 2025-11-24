# Database Migration Guide - News-BLKOUT

## Migration 001: Upvote Tracking System

**Date**: 2025-11-24
**Purpose**: Fix upvoting system to track individual user votes and prevent duplicates

### What This Migration Does

1. **Creates `news_votes` table**:
   - Tracks individual user upvotes for articles
   - Prevents duplicate votes with UNIQUE constraint
   - Links to `news_articles` and `auth.users` tables
   - Includes RLS policies for security

2. **Adds columns to `news_articles`**:
   - `upvote_count INT` - Total number of upvotes
   - `last_upvoted_at TIMESTAMP` - When last upvote occurred

3. **Creates automatic trigger**:
   - `update_news_article_upvote_count()` function
   - Automatically updates vote counts when votes are added/removed
   - Updates interest score based on engagement

4. **Implements Row Level Security**:
   - Anyone can view votes
   - Authenticated users can add their own votes
   - Users can only delete their own votes

### How to Apply This Migration

#### Option 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `migration_001_upvote_tracking.sql`
3. Paste into SQL Editor
4. Click "Run" to execute the migration

#### Option 2: Supabase CLI

```bash
# Apply migration using Supabase CLI
supabase db push

# Or run the specific migration file
supabase db execute -f database/migration_001_upvote_tracking.sql
```

### Verification Steps

After applying the migration, verify it worked:

```sql
-- Check if news_votes table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'news_votes';

-- Check if new columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'news_articles'
AND column_name IN ('upvote_count', 'last_upvoted_at');

-- Check if trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'news_article_upvote_count_trigger';

-- Verify RLS policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'news_votes';
```

Expected results:
- ✅ `news_votes` table exists
- ✅ `upvote_count` and `last_upvoted_at` columns exist in `news_articles`
- ✅ `news_article_upvote_count_trigger` trigger exists
- ✅ Three RLS policies exist for `news_votes`

### Testing the Implementation

1. **Test upvoting (authenticated)**:
```bash
curl -X POST https://your-domain.com/api/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"articleId": "YOUR_ARTICLE_ID"}'
```

Expected: Vote is recorded, count increases

2. **Test duplicate prevention**:
```bash
# Make the same request again
curl -X POST https://your-domain.com/api/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"articleId": "YOUR_ARTICLE_ID"}'
```

Expected: Vote is removed (toggle behavior), count decreases

3. **Test unauthenticated voting**:
```bash
curl -X POST https://your-domain.com/api/vote \
  -H "Content-Type: application/json" \
  -d '{"articleId": "YOUR_ARTICLE_ID"}'
```

Expected: 401 Unauthorized error

### Rollback Plan

If you need to rollback this migration:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS news_article_upvote_count_trigger ON news_votes;

-- Remove function
DROP FUNCTION IF EXISTS update_news_article_upvote_count();

-- Remove table (CASCADE will remove all associated data)
DROP TABLE IF EXISTS news_votes CASCADE;

-- Remove columns from news_articles (optional)
ALTER TABLE news_articles
  DROP COLUMN IF EXISTS upvote_count,
  DROP COLUMN IF EXISTS last_upvoted_at;
```

⚠️ **Warning**: Rollback will delete all upvote data!

### Security Considerations

- ✅ Authentication required for voting
- ✅ Users can only vote once per article
- ✅ RLS policies prevent unauthorized access
- ✅ Database triggers ensure data integrity
- ✅ User IDs are tracked for audit purposes

### Performance Impact

- **Minimal**: Indexes are created for optimal query performance
- **Read operations**: No impact, votes are counted by trigger
- **Write operations**: Slightly slower (trigger execution), but within acceptable range
- **Storage**: ~50 bytes per vote record

### Next Steps

After applying this migration:

1. ✅ Deploy updated API endpoints (`/api/vote`, `/api/user-vote`)
2. ✅ Deploy updated frontend (`ArticleCard.tsx`)
3. Test in staging environment
4. Monitor for errors in production logs
5. Verify vote counts are updating correctly

### Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check Vercel logs for API errors
3. Verify environment variables are set correctly
4. Ensure authentication is working properly

---

**Created by**: BLKOUT Development Team
**Migration file**: `migration_001_upvote_tracking.sql`
