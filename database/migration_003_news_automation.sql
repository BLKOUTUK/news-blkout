-- Migration 003: News Automation Support
-- Date: 2025-11-25
-- Purpose: Add fields needed for automated news ingestion

-- Add url_hash column for deduplication
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS url_hash TEXT;

-- Create unique index on url_hash to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url_hash
  ON news_articles(url_hash)
  WHERE url_hash IS NOT NULL;

-- Add moderation_status column for auto-approved content
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'auto-approved', 'approved', 'flagged', 'rejected'));

-- Add topics/tags array column
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Create index for topics search
CREATE INDEX IF NOT EXISTS idx_news_articles_topics
  ON news_articles USING GIN(topics);

-- Create index for moderation status
CREATE INDEX IF NOT EXISTS idx_news_articles_moderation
  ON news_articles(moderation_status);

-- Update RLS policy to allow service role to insert
-- (Service role bypasses RLS, but good to document)
COMMENT ON TABLE news_articles IS 'News articles - supports both manual submission and automated ingestion. Auto-ingested articles are marked as auto-approved.';
COMMENT ON COLUMN news_articles.url_hash IS 'MD5 hash of source_url for deduplication during automated ingestion';
COMMENT ON COLUMN news_articles.moderation_status IS 'Moderation state: pending (manual), auto-approved (automated), approved (reviewed), flagged, rejected';
COMMENT ON COLUMN news_articles.topics IS 'Array of topic tags from source feed or auto-categorization';

-- Populate url_hash for existing articles
UPDATE news_articles
SET url_hash = md5(lower(source_url))
WHERE url_hash IS NULL AND source_url IS NOT NULL;
