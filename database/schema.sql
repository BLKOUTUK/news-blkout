-- BLKOUT Newsroom Database Schema
-- Community-curated news platform aligned with liberation values

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- News Articles Table
CREATE TABLE IF NOT EXISTS newsroom_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Core fields
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  category TEXT NOT NULL CHECK (category IN ('liberation', 'community', 'politics', 'culture', 'economics', 'health', 'technology', 'environment', 'opinion', 'features')),
  author TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  read_time TEXT NOT NULL,

  -- Story aggregation (Phase 1)
  original_url TEXT,
  source_name TEXT,
  curator_id UUID,
  submitted_at TIMESTAMP WITH TIME ZONE,

  -- Community engagement
  interest_score INTEGER DEFAULT 0 CHECK (interest_score >= 0 AND interest_score <= 100),
  total_votes INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,

  -- IVOR learning data
  topics TEXT[] DEFAULT '{}',
  sentiment TEXT,
  relevance_score INTEGER DEFAULT 0 CHECK (relevance_score >= 0 AND relevance_score <= 100),

  -- Featured content
  is_story_of_week BOOLEAN DEFAULT FALSE,
  weekly_rank INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Media
  featured_image TEXT,
  image_alt TEXT,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_status ON newsroom_articles(status);
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_category ON newsroom_articles(category);
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_published_at ON newsroom_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_interest_score ON newsroom_articles(interest_score DESC);
CREATE INDEX IF NOT EXISTS idx_newsroom_articles_story_of_week ON newsroom_articles(is_story_of_week) WHERE is_story_of_week = TRUE;

-- Newsroom Votes Table
CREATE TABLE IF NOT EXISTS newsroom_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES newsroom_articles(id) ON DELETE CASCADE,
  user_id UUID,
  interest_level TEXT CHECK (interest_level IN ('low', 'medium', 'high')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate votes
  UNIQUE(article_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_newsroom_votes_article ON newsroom_votes(article_id);

-- Writer Profiles Table
CREATE TABLE IF NOT EXISTS newsroom_writers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  articles_published INTEGER DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  specialties TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter Subscriptions Table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  categories TEXT[] DEFAULT '{}',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);

-- Analytics Table
CREATE TABLE IF NOT EXISTS newsroom_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES newsroom_articles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'share', 'bookmark')),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsroom_analytics_article ON newsroom_analytics(article_id);
CREATE INDEX IF NOT EXISTS idx_newsroom_analytics_event_type ON newsroom_analytics(event_type);

-- Row Level Security (RLS) Policies
ALTER TABLE newsroom_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsroom_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsroom_writers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsroom_analytics ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Public can view published articles"
  ON newsroom_articles FOR SELECT
  USING (status = 'published');

-- Public read access for writers
CREATE POLICY "Public can view writers"
  ON newsroom_writers FOR SELECT
  USING (true);

-- Users can vote (requires authentication)
CREATE POLICY "Authenticated users can vote"
  ON newsroom_votes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Newsletter subscriptions
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions FOR INSERT
  WITH CHECK (true);

-- Analytics tracking
CREATE POLICY "Anyone can track analytics"
  ON newsroom_analytics FOR INSERT
  WITH CHECK (true);

-- Function to update article interest score based on votes
CREATE OR REPLACE FUNCTION update_article_interest_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE newsroom_articles
  SET
    total_votes = (SELECT COUNT(*) FROM newsroom_votes WHERE article_id = NEW.article_id),
    upvotes = (SELECT COUNT(*) FROM newsroom_votes WHERE article_id = NEW.article_id AND interest_level IN ('medium', 'high')),
    interest_score = (
      SELECT COALESCE(
        ROUND(
          (COUNT(CASE WHEN interest_level = 'high' THEN 1 END) * 100.0 +
           COUNT(CASE WHEN interest_level = 'medium' THEN 1 END) * 50.0) /
          NULLIF(COUNT(*), 0)
        ), 0
      )
      FROM newsroom_votes
      WHERE article_id = NEW.article_id
    )
  WHERE id = NEW.article_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update interest score on vote
CREATE TRIGGER update_interest_score_on_vote
  AFTER INSERT OR UPDATE ON newsroom_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_article_interest_score();

-- Comments for documentation
COMMENT ON TABLE newsroom_articles IS 'Community-curated news articles for BLKOUT platform';
COMMENT ON TABLE newsroom_votes IS 'Community votes on article interest and relevance';
COMMENT ON TABLE newsroom_writers IS 'Writer profiles and contributions';
COMMENT ON TABLE newsletter_subscriptions IS 'Newsletter subscription management';
COMMENT ON TABLE newsroom_analytics IS 'Article engagement and analytics tracking';
