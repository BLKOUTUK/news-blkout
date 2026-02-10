-- Migration 004: Fortnightly Voting Periods
-- Run in Supabase SQL Editor

-- 1. Create voting_periods table
CREATE TABLE IF NOT EXISTS voting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_number INT NOT NULL UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  winner_1_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
  winner_2_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
  winner_3_id UUID REFERENCES news_articles(id) ON DELETE SET NULL,
  total_articles INT DEFAULT 0,
  total_votes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_voting_periods_status ON voting_periods(status);
CREATE INDEX IF NOT EXISTS idx_voting_periods_period_number ON voting_periods(period_number DESC);

-- 2. Add voting_period_id to news_articles
ALTER TABLE news_articles
  ADD COLUMN IF NOT EXISTS voting_period_id UUID REFERENCES voting_periods(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_voting_period ON news_articles(voting_period_id);

-- 3. Trigger: auto-assign voting_period_id when article status changes to 'published'
CREATE OR REPLACE FUNCTION assign_voting_period()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign if status is changing to 'published' and no period assigned yet
  IF NEW.status = 'published' AND (NEW.voting_period_id IS NULL) THEN
    SELECT id INTO NEW.voting_period_id
    FROM voting_periods
    WHERE status = 'active'
    ORDER BY period_number DESC
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assign_voting_period_trigger ON news_articles;
CREATE TRIGGER assign_voting_period_trigger
  BEFORE INSERT OR UPDATE ON news_articles
  FOR EACH ROW
  EXECUTE FUNCTION assign_voting_period();

-- 4. Bootstrap: Create Period #1 starting today (Feb 10, 2026)
INSERT INTO voting_periods (period_number, start_date, end_date, status)
VALUES (
  1,
  DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/London') AT TIME ZONE 'Europe/London',
  (DATE_TRUNC('day', NOW() AT TIME ZONE 'Europe/London') + INTERVAL '14 days' - INTERVAL '1 second') AT TIME ZONE 'Europe/London',
  'active'
)
ON CONFLICT (period_number) DO NOTHING;

-- 5. Backfill: assign existing published articles to Period #1
UPDATE news_articles
SET voting_period_id = (SELECT id FROM voting_periods WHERE period_number = 1)
WHERE status = 'published'
  AND published = true
  AND voting_period_id IS NULL;

-- 6. Update total_articles count for Period #1
UPDATE voting_periods
SET total_articles = (
  SELECT COUNT(*) FROM news_articles WHERE voting_period_id = voting_periods.id
),
total_votes = (
  SELECT COALESCE(SUM(total_votes), 0) FROM news_articles WHERE voting_period_id = voting_periods.id
)
WHERE period_number = 1;
