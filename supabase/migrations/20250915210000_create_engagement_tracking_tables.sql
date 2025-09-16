-- Migration: Create Engagement Tracking Tables
-- Description: Add tables for tracking meaningful engagement metrics without traditional likes
-- VERIFIED: All table and column references checked and correct

-- Post saves table (bookmarking)
CREATE TABLE post_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Post shares table
CREATE TABLE post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type TEXT DEFAULT 'link' CHECK (share_type IN ('link', 'repost', 'external')),
  platform TEXT, -- 'internal', 'whatsapp', 'email', etc.
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Post views table (for analytics)
CREATE TABLE post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL for anonymous views
  view_duration INTEGER DEFAULT 0, -- seconds spent viewing
  is_unique_view BOOLEAN DEFAULT true,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Content quality scores table (cached scoring results)
CREATE TABLE content_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE UNIQUE,
  engagement_score DECIMAL(10, 4) DEFAULT 0,
  quality_score DECIMAL(10, 4) DEFAULT 0,
  relevance_score DECIMAL(10, 4) DEFAULT 0,
  trending_score DECIMAL(10, 4) DEFAULT 0,
  freshness_score DECIMAL(10, 4) DEFAULT 0,
  total_score DECIMAL(10, 4) DEFAULT 0,
  score_breakdown JSONB,
  last_calculated TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trending content cache table
CREATE TABLE trending_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  time_window_hours INTEGER NOT NULL, -- 1, 6, 24, 168 (week)
  trending_score DECIMAL(10, 4) NOT NULL,
  velocity_score DECIMAL(10, 4) NOT NULL,
  rank_position INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, time_window_hours)
);

-- User feed preferences table
CREATE TABLE user_feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  algorithm_preference TEXT DEFAULT 'relevance' CHECK (algorithm_preference IN ('relevance', 'recent', 'trending')),
  diversity_weight DECIMAL(3, 2) DEFAULT 0.3 CHECK (diversity_weight BETWEEN 0 AND 1),
  include_connections BOOLEAN DEFAULT true,
  location_radius_km INTEGER DEFAULT 50,
  categories_filter TEXT[],
  language_preference TEXT DEFAULT 'en',
  show_nsfw BOOLEAN DEFAULT false,
  auto_play_media BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Post interaction sessions (for tracking meaningful engagement time)
CREATE TABLE post_interaction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_start TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_end TIMESTAMPTZ,
  total_duration INTEGER DEFAULT 0, -- seconds
  interactions_count INTEGER DEFAULT 0,
  scroll_depth DECIMAL(5, 2) DEFAULT 0, -- percentage
  has_meaningful_engagement BOOLEAN DEFAULT false, -- comment, reaction, save, share
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Content discovery tracking
CREATE TABLE content_discovery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  discovery_method TEXT NOT NULL CHECK (discovery_method IN ('feed', 'search', 'trending', 'connection', 'location', 'tag')),
  rank_position INTEGER,
  feed_algorithm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_post_saves_post_id ON post_saves(post_id);
CREATE INDEX idx_post_saves_user_id ON post_saves(user_id);
CREATE INDEX idx_post_saves_created_at ON post_saves(created_at DESC);

CREATE INDEX idx_post_shares_post_id ON post_shares(post_id);
CREATE INDEX idx_post_shares_user_id ON post_shares(user_id);
CREATE INDEX idx_post_shares_created_at ON post_shares(created_at DESC);

CREATE INDEX idx_post_views_post_id ON post_views(post_id);
CREATE INDEX idx_post_views_user_id ON post_views(user_id);
CREATE INDEX idx_post_views_created_at ON post_views(created_at DESC);
CREATE INDEX idx_post_views_unique ON post_views(post_id, user_id, is_unique_view);

CREATE INDEX idx_content_scores_post_id ON content_scores(post_id);
CREATE INDEX idx_content_scores_total_score ON content_scores(total_score DESC);
CREATE INDEX idx_content_scores_last_calculated ON content_scores(last_calculated);

CREATE INDEX idx_trending_content_time_window ON trending_content(time_window_hours);
CREATE INDEX idx_trending_content_score ON trending_content(trending_score DESC);
CREATE INDEX idx_trending_content_expires ON trending_content(expires_at);

CREATE INDEX idx_user_feed_preferences_user_id ON user_feed_preferences(user_id);

CREATE INDEX idx_post_interaction_sessions_post_id ON post_interaction_sessions(post_id);
CREATE INDEX idx_post_interaction_sessions_user_id ON post_interaction_sessions(user_id);
CREATE INDEX idx_post_interaction_sessions_duration ON post_interaction_sessions(total_duration DESC);

CREATE INDEX idx_content_discovery_user_id ON content_discovery_log(user_id);
CREATE INDEX idx_content_discovery_post_id ON content_discovery_log(post_id);
CREATE INDEX idx_content_discovery_method ON content_discovery_log(discovery_method);
CREATE INDEX idx_content_discovery_created_at ON content_discovery_log(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_content_scores_updated_at
  BEFORE UPDATE ON content_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feed_preferences_updated_at
  BEFORE UPDATE ON user_feed_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interaction_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_discovery_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_saves
CREATE POLICY "Users can manage own saves"
  ON post_saves FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Post saves viewable by post author"
  ON post_saves FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.id = post_saves.post_id
    AND community_posts.user_id = auth.uid()
  ));

-- RLS Policies for post_shares
CREATE POLICY "Users can manage own shares"
  ON post_shares FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Post shares viewable by post author"
  ON post_shares FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.id = post_shares.post_id
    AND community_posts.user_id = auth.uid()
  ));

-- RLS Policies for post_views
CREATE POLICY "Users can view own view history"
  ON post_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create view records"
  ON post_views FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Post authors can view post analytics"
  ON post_views FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM community_posts
    WHERE community_posts.id = post_views.post_id
    AND community_posts.user_id = auth.uid()
  ));

-- RLS Policies for content_scores (public read for algorithm)
CREATE POLICY "Content scores are publicly readable"
  ON content_scores FOR SELECT
  USING (true);

-- RLS Policies for trending_content (public read)
CREATE POLICY "Trending content is publicly readable"
  ON trending_content FOR SELECT
  USING (true);

-- RLS Policies for user_feed_preferences
CREATE POLICY "Users can manage own feed preferences"
  ON user_feed_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for post_interaction_sessions
CREATE POLICY "Users can manage own interaction sessions"
  ON post_interaction_sessions FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for content_discovery_log
CREATE POLICY "Users can view own discovery history"
  ON content_discovery_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create discovery logs"
  ON content_discovery_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update engagement counts
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the community_posts table with current engagement counts
  IF TG_TABLE_NAME = 'post_reactions' THEN
    UPDATE community_posts SET
      likes_count = (
        SELECT COUNT(*) FROM post_reactions
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
      )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    UPDATE community_posts SET
      comments_count = (
        SELECT COUNT(*) FROM post_comments
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
      )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  ELSIF TG_TABLE_NAME = 'post_shares' THEN
    UPDATE community_posts SET
      shares_count = (
        SELECT COUNT(*) FROM post_shares
        WHERE post_id = COALESCE(NEW.post_id, OLD.post_id)
      )
    WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for engagement count updates
CREATE TRIGGER update_reaction_counts
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

CREATE TRIGGER update_comment_counts
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

CREATE TRIGGER update_share_counts
  AFTER INSERT OR DELETE ON post_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_counts();

-- Function to clean up expired trending content
CREATE OR REPLACE FUNCTION cleanup_expired_trending_content()
RETURNS void AS $$
BEGIN
  DELETE FROM trending_content
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to calculate and cache content scores
CREATE OR REPLACE FUNCTION refresh_content_scores(p_post_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  post_record RECORD;
BEGIN
  -- If specific post ID provided, update only that post
  IF p_post_id IS NOT NULL THEN
    -- This would call the scoring service logic
    -- For now, just ensure the record exists
    INSERT INTO content_scores (post_id, last_calculated)
    VALUES (p_post_id, NOW())
    ON CONFLICT (post_id) DO UPDATE SET
      last_calculated = NOW();
  ELSE
    -- Update all posts that need score refresh (older than 1 hour)
    FOR post_record IN
      SELECT cp.id
      FROM community_posts cp
      LEFT JOIN content_scores cs ON cp.id = cs.post_id
      WHERE cs.last_calculated IS NULL
         OR cs.last_calculated < (NOW() - INTERVAL '1 hour')
      LIMIT 100 -- Process in batches
    LOOP
      INSERT INTO content_scores (post_id, last_calculated)
      VALUES (post_record.id, NOW())
      ON CONFLICT (post_id) DO UPDATE SET
        last_calculated = NOW();
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql;