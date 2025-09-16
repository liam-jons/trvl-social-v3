-- Migration: Enhance Connection System
-- Description: Add additional indexes and constraints for the connection system

-- Add index for connection recommendations (shared adventures)
CREATE INDEX IF NOT EXISTS idx_group_members_user_group
ON group_members(user_id, group_id);

-- Add index for connection activity feed
CREATE INDEX IF NOT EXISTS idx_community_posts_user_visibility_created
ON community_posts(user_id, visibility, created_at DESC);

-- Add index for connection strength calculations
CREATE INDEX IF NOT EXISTS idx_community_connections_strength
ON community_connections(connection_strength DESC)
WHERE status = 'accepted';

-- Add index for mutual connections queries
CREATE INDEX IF NOT EXISTS idx_community_connections_connected_status
ON community_connections(connected_user_id, status)
WHERE status = 'accepted';

-- Add index for engagement score calculations
CREATE INDEX IF NOT EXISTS idx_engagement_scores_user_score
ON engagement_scores(user_id, engagement_score DESC);

-- Add function to calculate connection strength based on interactions
CREATE OR REPLACE FUNCTION calculate_connection_strength(
  p_user_id UUID,
  p_connected_user_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  interaction_count INTEGER;
  days_connected INTEGER;
  strength_score DECIMAL(3,2);
BEGIN
  -- Get current interaction count
  SELECT COALESCE(cc.interaction_count, 0)
  INTO interaction_count
  FROM community_connections cc
  WHERE cc.user_id = p_user_id
    AND cc.connected_user_id = p_connected_user_id
    AND cc.status = 'accepted';

  -- Get days since connection
  SELECT COALESCE(
    EXTRACT(DAYS FROM (NOW() - cc.created_at))::INTEGER,
    1
  )
  INTO days_connected
  FROM community_connections cc
  WHERE cc.user_id = p_user_id
    AND cc.connected_user_id = p_connected_user_id
    AND cc.status = 'accepted';

  -- Calculate strength score (0.0 to 1.0)
  -- Base strength starts at 0.5, increases with interactions
  strength_score := 0.5 + (interaction_count::DECIMAL / 100.0);

  -- Add time bonus for active connections
  IF days_connected > 0 AND interaction_count > 0 THEN
    strength_score := strength_score + (interaction_count::DECIMAL / days_connected::DECIMAL / 10.0);
  END IF;

  -- Cap at 1.0
  strength_score := LEAST(strength_score, 1.0);

  RETURN strength_score;
END;
$$ LANGUAGE plpgsql;

-- Add function to get connection recommendations
CREATE OR REPLACE FUNCTION get_connection_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  location TEXT,
  shared_adventures INTEGER,
  recommendation_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH shared_adventures AS (
    -- Find users who were in the same groups
    SELECT
      gm2.user_id,
      COUNT(DISTINCT gm1.group_id) as adventure_count
    FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    JOIN groups g ON gm1.group_id = g.id
    WHERE gm1.user_id = p_user_id
      AND gm2.user_id != p_user_id
      AND g.status IN ('completed', 'active')
      -- Exclude existing connections
      AND NOT EXISTS (
        SELECT 1 FROM community_connections cc
        WHERE cc.user_id = p_user_id
          AND cc.connected_user_id = gm2.user_id
          AND cc.status IN ('accepted', 'blocked')
      )
      -- Exclude pending requests
      AND NOT EXISTS (
        SELECT 1 FROM connection_requests cr
        WHERE ((cr.requester_id = p_user_id AND cr.recipient_id = gm2.user_id)
            OR (cr.requester_id = gm2.user_id AND cr.recipient_id = p_user_id))
          AND cr.status = 'pending'
      )
    GROUP BY gm2.user_id
  )
  SELECT
    p.id as user_id,
    p.full_name,
    p.avatar_url,
    p.location,
    sa.adventure_count as shared_adventures,
    -- Simple recommendation score based on shared adventures
    (sa.adventure_count * 20)::INTEGER as recommendation_score
  FROM shared_adventures sa
  JOIN profiles p ON sa.user_id = p.id
  ORDER BY sa.adventure_count DESC, p.full_name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add function to update engagement scores
CREATE OR REPLACE FUNCTION update_user_engagement_score(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  total_posts INTEGER;
  total_comments INTEGER;
  total_reactions INTEGER;
  total_connections INTEGER;
  calculated_score DECIMAL(10,2);
BEGIN
  -- Count user's posts
  SELECT COUNT(*) INTO total_posts
  FROM community_posts
  WHERE user_id = p_user_id;

  -- Count user's comments
  SELECT COUNT(*) INTO total_comments
  FROM post_comments
  WHERE user_id = p_user_id;

  -- Count user's reactions
  SELECT COUNT(*) INTO total_reactions
  FROM post_reactions
  WHERE user_id = p_user_id;

  -- Count user's connections
  SELECT COUNT(*) INTO total_connections
  FROM community_connections
  WHERE user_id = p_user_id AND status = 'accepted';

  -- Calculate engagement score
  calculated_score := (total_posts * 10) +
                     (total_comments * 5) +
                     (total_reactions * 2) +
                     (total_connections * 15);

  -- Upsert engagement score
  INSERT INTO engagement_scores (
    user_id,
    total_posts,
    total_comments,
    total_reactions,
    total_connections,
    engagement_score,
    last_calculated,
    updated_at
  ) VALUES (
    p_user_id,
    total_posts,
    total_comments,
    total_reactions,
    total_connections,
    calculated_score,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_posts = EXCLUDED.total_posts,
    total_comments = EXCLUDED.total_comments,
    total_reactions = EXCLUDED.total_reactions,
    total_connections = EXCLUDED.total_connections,
    engagement_score = EXCLUDED.engagement_score,
    last_calculated = EXCLUDED.last_calculated,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update connection strength on interaction
CREATE OR REPLACE FUNCTION update_connection_strength_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update connection strength for both directions
  UPDATE community_connections
  SET connection_strength = calculate_connection_strength(user_id, connected_user_id)
  WHERE (user_id = NEW.user_id AND connected_user_id = NEW.connected_user_id)
     OR (user_id = NEW.connected_user_id AND connected_user_id = NEW.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic connection strength updates
DROP TRIGGER IF EXISTS trigger_update_connection_strength ON community_connections;
CREATE TRIGGER trigger_update_connection_strength
  AFTER UPDATE OF interaction_count ON community_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_connection_strength_trigger();

-- Add RLS policies for connection recommendations function
-- (Functions inherit permissions from the tables they access)

-- Create view for connection analytics
CREATE OR REPLACE VIEW connection_analytics AS
SELECT
  u.id as user_id,
  u.full_name,
  COALESCE(connection_stats.connection_count, 0) as connection_count,
  COALESCE(connection_stats.avg_strength, 0) as avg_connection_strength,
  COALESCE(engagement.engagement_score, 0) as engagement_score,
  COALESCE(activity_stats.posts_count, 0) as posts_count,
  COALESCE(activity_stats.comments_count, 0) as comments_count
FROM profiles u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*) as connection_count,
    AVG(connection_strength) as avg_strength
  FROM community_connections
  WHERE status = 'accepted'
  GROUP BY user_id
) connection_stats ON u.id = connection_stats.user_id
LEFT JOIN engagement_scores engagement ON u.id = engagement.user_id
LEFT JOIN (
  SELECT
    p.id as user_id,
    COUNT(DISTINCT posts.id) as posts_count,
    COUNT(DISTINCT comments.id) as comments_count
  FROM profiles p
  LEFT JOIN community_posts posts ON p.id = posts.user_id
  LEFT JOIN post_comments comments ON p.id = comments.user_id
  GROUP BY p.id
) activity_stats ON u.id = activity_stats.user_id;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_connection_strength(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_recommendations(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_engagement_score(UUID) TO authenticated;
GRANT SELECT ON connection_analytics TO authenticated;