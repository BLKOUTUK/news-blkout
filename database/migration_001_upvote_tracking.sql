-- Migration: Add proper upvote tracking for news-blkout
-- Date: 2025-11-24
-- Purpose: Fix upvoting system to track individual user votes and prevent duplicates

-- Create news_votes table for tracking individual upvotes
CREATE TABLE IF NOT EXISTS news_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate votes from same user
  UNIQUE(article_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_votes_article_id ON news_votes(article_id);
CREATE INDEX IF NOT EXISTS idx_news_votes_user_id ON news_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_news_votes_created_at ON news_votes(created_at DESC);

-- Ensure news_articles has the necessary columns
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_upvoted_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically update upvote counts
CREATE OR REPLACE FUNCTION update_news_article_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment upvote count
    UPDATE news_articles
    SET
      upvote_count = COALESCE(upvote_count, 0) + 1,
      total_votes = COALESCE(total_votes, 0) + 1,
      last_upvoted_at = NEW.created_at,
      interest_score = LEAST(100, COALESCE(interest_score, 50) + 2)
    WHERE id = NEW.article_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement upvote count
    UPDATE news_articles
    SET
      upvote_count = GREATEST(0, COALESCE(upvote_count, 0) - 1),
      total_votes = GREATEST(0, COALESCE(total_votes, 0) - 1),
      interest_score = GREATEST(0, COALESCE(interest_score, 50) - 2)
    WHERE id = OLD.article_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update counts on vote changes
DROP TRIGGER IF EXISTS news_article_upvote_count_trigger ON news_votes;
CREATE TRIGGER news_article_upvote_count_trigger
  AFTER INSERT OR DELETE ON news_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_news_article_upvote_count();

-- Enable Row Level Security
ALTER TABLE news_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read votes
CREATE POLICY "Anyone can view votes"
  ON news_votes FOR SELECT
  USING (true);

-- RLS Policy: Authenticated users can insert their own votes
CREATE POLICY "Authenticated users can vote"
  ON news_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON news_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE news_votes IS 'Individual user upvotes for news articles with duplicate prevention';
COMMENT ON COLUMN news_votes.article_id IS 'Reference to news_articles';
COMMENT ON COLUMN news_votes.user_id IS 'Reference to authenticated user';
