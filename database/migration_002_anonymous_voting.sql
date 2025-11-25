-- Migration 002: Enable anonymous voting for news-blkout
-- Date: 2025-11-25
-- Purpose: Allow visitors to vote without requiring authentication

-- Add voter_id column for anonymous voting (hashed IP+UA)
ALTER TABLE news_votes
  ADD COLUMN IF NOT EXISTS voter_id TEXT;

-- Create index for voter_id lookups
CREATE INDEX IF NOT EXISTS idx_news_votes_voter_id ON news_votes(voter_id);

-- Drop the old unique constraint on (article_id, user_id)
ALTER TABLE news_votes DROP CONSTRAINT IF EXISTS news_votes_article_id_user_id_key;

-- Create new unique constraint on (article_id, voter_id)
-- This allows one vote per fingerprint per article
ALTER TABLE news_votes ADD CONSTRAINT news_votes_article_voter_unique
  UNIQUE(article_id, voter_id);

-- Drop existing RLS policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can vote" ON news_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON news_votes;

-- New RLS Policy: Anyone can insert votes (service role will handle deduplication)
CREATE POLICY "Anyone can vote"
  ON news_votes FOR INSERT
  WITH CHECK (true);

-- New RLS Policy: Anyone can delete their vote by voter_id
CREATE POLICY "Anyone can delete by voter_id"
  ON news_votes FOR DELETE
  USING (true);

-- Update documentation
COMMENT ON COLUMN news_votes.voter_id IS 'Hashed anonymous voter identifier (IP+UA hash) for vote deduplication without authentication';
COMMENT ON TABLE news_votes IS 'Individual upvotes for news articles - supports both authenticated and anonymous voting';
