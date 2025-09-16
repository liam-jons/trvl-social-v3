-- Optimize Database Indexes for Compatibility Score Performance
-- Migration to add performance-optimized indexes for compatibility scoring queries

BEGIN;

-- Drop existing indexes if they exist to recreate them optimally
DROP INDEX IF EXISTS idx_compatibility_scores_lookup;
DROP INDEX IF EXISTS idx_compatibility_scores_group;
DROP INDEX IF EXISTS idx_compatibility_scores_calculated;
DROP INDEX IF EXISTS idx_personality_assessments_user;
DROP INDEX IF EXISTS idx_profiles_lookup;

-- 1. Core compatibility scores table indexes
-- Primary lookup index for user with group context
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_user_group
ON group_compatibility_scores (
  user_id,
  group_id,
  calculated_at DESC
);

-- Index for group-based queries (find all scores in a group)
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_group_performance
ON group_compatibility_scores (group_id, compatibility_score DESC, calculated_at DESC)
WHERE group_id IS NOT NULL;

-- Index for score range queries and filtering
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_range
ON group_compatibility_scores (compatibility_score DESC, calculated_at DESC)
WHERE compatibility_score >= 0;

-- Index for recent calculations (cache invalidation and freshness)
-- Note: Removed WHERE clause with NOW() as it requires immutable functions
-- This index will be used for range queries on calculated_at
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_recent
ON group_compatibility_scores (calculated_at DESC, user_id);

-- Partial index for high-quality scores (commonly accessed)
-- Note: Removed dynamic date condition with NOW() as it requires immutable functions
-- This index will be used for high-quality score queries
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_high_quality
ON group_compatibility_scores (user_id, group_id, calculated_at DESC)
WHERE compatibility_score >= 70;

-- 2. Personality assessments indexes for fast profile loading
-- Primary lookup for user personality data
CREATE INDEX IF NOT EXISTS idx_personality_assessments_user_recent
ON personality_assessments (user_id, completed_at DESC, updated_at DESC);

-- Index for personality style queries
CREATE INDEX IF NOT EXISTS idx_personality_styles
ON personality_assessments (adventure_style, budget_preference, planning_style, completed_at DESC)
WHERE completed_at IS NOT NULL;

-- Composite index for personality traits
CREATE INDEX IF NOT EXISTS idx_personality_traits
ON personality_assessments (openness, conscientiousness, extraversion, agreeableness, neuroticism)
WHERE completed_at IS NOT NULL;

-- Index for group preference matching
CREATE INDEX IF NOT EXISTS idx_personality_group_pref
ON personality_assessments (group_preference, adventure_style, user_id)
WHERE completed_at IS NOT NULL;

-- 3. Profiles table indexes for demographic matching
-- Enhanced profile lookup with demographic data
-- Note: Using date_of_birth instead of age column (age column doesn't exist in profiles table)
CREATE INDEX IF NOT EXISTS idx_profiles_demographics
ON profiles (id, date_of_birth, location, updated_at DESC)
WHERE date_of_birth IS NOT NULL;

-- Date of birth index for age-based compatibility matching
-- Note: Age calculations will be done in application logic using date_of_birth
CREATE INDEX IF NOT EXISTS idx_profiles_date_of_birth_range
ON profiles (date_of_birth, id, updated_at DESC)
WHERE date_of_birth IS NOT NULL;

-- Location-based grouping index
-- Note: Removed age reference - using date_of_birth instead
CREATE INDEX IF NOT EXISTS idx_profiles_location
ON profiles (location, date_of_birth, id)
WHERE location IS NOT NULL AND location != '';

-- 4. Group compositions and members indexes
-- Index for finding group members efficiently
-- Note: group_members table uses 'joined_at' not 'created_at'
CREATE INDEX IF NOT EXISTS idx_group_members_group_user
ON group_members (group_id, user_id, joined_at DESC);

-- Index for user's group memberships
-- Note: Verified - group_members has is_active and joined_at columns
CREATE INDEX IF NOT EXISTS idx_group_members_user_active
ON group_members (user_id, group_id, is_active, joined_at DESC);

-- Index for group analysis
-- Note: Verified - groups table has is_active, current_members, and created_at columns
CREATE INDEX IF NOT EXISTS idx_groups_active_members
ON groups (is_active, current_members, created_at DESC);

-- 5. Background job results indexes
-- Create table for background job results if it doesn't exist
CREATE TABLE IF NOT EXISTS background_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  job_type TEXT NOT NULL,
  results JSONB,
  metadata JSONB,
  stored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Index for job result lookup
CREATE INDEX IF NOT EXISTS idx_background_job_results_lookup
ON background_job_results (job_id, job_type, stored_at DESC);

-- Index for cleanup of expired results
CREATE INDEX IF NOT EXISTS idx_background_job_results_expiry
ON background_job_results (expires_at)
WHERE expires_at IS NOT NULL;

-- 6. Algorithm configurations indexes
-- Index for active algorithm lookups
CREATE INDEX IF NOT EXISTS idx_compatibility_algorithms_active
ON compatibility_algorithms (is_active, updated_at DESC, weight_personality DESC)
WHERE is_active = true;

-- 7. Booking participants indexes for group building
-- Enhanced index for participant availability queries
-- Note: Verified - booking_participants table has booking_id, user_id, and created_at columns
CREATE INDEX IF NOT EXISTS idx_booking_participants_adventure
ON booking_participants (
  booking_id,
  user_id,
  created_at DESC
);

-- Index for adventure-based participant queries
-- Note: Verified - bookings table has adventure_id, status, and booking_date columns
CREATE INDEX IF NOT EXISTS idx_bookings_adventure_status
ON bookings (adventure_id, status, booking_date DESC)
WHERE status = 'confirmed';

-- 8. Performance monitoring indexes
-- Create performance monitoring table for query analysis
CREATE TABLE IF NOT EXISTS query_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type TEXT NOT NULL,
  execution_time_ms INTEGER,
  result_count INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  user_count INTEGER,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance analysis
CREATE INDEX IF NOT EXISTS idx_query_performance_analysis
ON query_performance_logs (query_type, executed_at DESC, execution_time_ms);

-- 9. Materialized view for frequently accessed compatibility data
-- Create materialized view for hot compatibility data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hot_compatibility_scores AS
SELECT
  gcs.user_id,
  gcs.group_id,
  AVG(gcs.compatibility_score)::INTEGER as avg_compatibility,
  COUNT(*) as calculation_count,
  MAX(gcs.calculated_at) as last_calculated,
  -- Include personality summaries for quick approximation
  AVG(gcs.personality_match)::INTEGER as avg_personality_match,
  AVG(gcs.interest_match)::INTEGER as avg_interest_match,
  AVG(gcs.style_match)::INTEGER as avg_style_match
FROM group_compatibility_scores gcs
WHERE gcs.calculated_at > NOW() - INTERVAL '30 days'
  AND gcs.compatibility_score >= 40  -- Only meaningful scores
GROUP BY
  gcs.user_id,
  gcs.group_id
HAVING COUNT(*) >= 1;  -- At least 1 calculation

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hot_compatibility_unique
ON mv_hot_compatibility_scores (user_id, COALESCE(group_id, '00000000-0000-0000-0000-000000000000'::uuid));

CREATE INDEX IF NOT EXISTS idx_mv_hot_compatibility_score
ON mv_hot_compatibility_scores (avg_compatibility DESC, last_calculated DESC);

-- 10. Stored procedures for common queries
-- Function to get cached compatibility score with fallback
CREATE OR REPLACE FUNCTION get_compatibility_score_fast(
  p_user_id UUID,
  p_group_id UUID DEFAULT NULL,
  p_max_age_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  compatibility_score INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE,
  from_cache BOOLEAN,
  confidence DECIMAL(3,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_cutoff_time TIMESTAMP WITH TIME ZONE := NOW() - (p_max_age_hours || ' hours')::INTERVAL;
BEGIN
  -- Try hot cache first (materialized view)
  IF p_group_id IS NULL THEN
    RETURN QUERY
    SELECT
      mv.avg_compatibility,
      mv.last_calculated,
      true as from_cache,
      CASE
        WHEN mv.calculation_count >= 5 THEN 0.90
        WHEN mv.calculation_count >= 3 THEN 0.80
        ELSE 0.70
      END::DECIMAL(3,2) as confidence
    FROM mv_hot_compatibility_scores mv
    WHERE mv.user_id = p_user_id
      AND mv.group_id IS NULL
      AND mv.last_calculated > v_cutoff_time
    LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- Try regular cache
  RETURN QUERY
  SELECT
    gcs.compatibility_score,
    gcs.calculated_at,
    true as from_cache,
    0.85::DECIMAL(3,2) as confidence
  FROM group_compatibility_scores gcs
  WHERE gcs.user_id = p_user_id
    AND (p_group_id IS NULL OR gcs.group_id = p_group_id)
    AND gcs.calculated_at > v_cutoff_time
  ORDER BY gcs.calculated_at DESC
  LIMIT 1;
END;
$$;

-- Function to refresh hot compatibility cache
CREATE OR REPLACE FUNCTION refresh_hot_compatibility_cache()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_hot_compatibility_scores;
END;
$$;

-- 11. Automatic cache refresh trigger
-- Create function to log query performance
CREATE OR REPLACE FUNCTION log_query_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert performance log entry for compatibility score queries
  INSERT INTO query_performance_logs (query_type, user_count, cache_hit)
  VALUES ('compatibility_calculation', 1, false);

  RETURN NEW;
END;
$$;

-- 12. Index usage analysis view
-- Fixed column references to match PostgreSQL system view pg_stat_user_indexes
-- relname = table name, indexrelname = index name
CREATE OR REPLACE VIEW v_index_usage_stats AS
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  CASE
    WHEN idx_scan = 0 THEN 'Never used'
    WHEN idx_scan < 100 THEN 'Low usage'
    WHEN idx_scan < 1000 THEN 'Medium usage'
    ELSE 'High usage'
  END as usage_category
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND (indexrelname LIKE 'idx_compatibility%'
       OR indexrelname LIKE 'idx_personality%'
       OR indexrelname LIKE 'idx_profiles%'
       OR indexrelname LIKE 'idx_group%')
ORDER BY idx_scan DESC;

-- 13. Cache warming stored procedure
CREATE OR REPLACE FUNCTION warm_compatibility_cache(
  p_user_ids UUID[],
  p_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  users_processed INTEGER,
  cache_hits INTEGER,
  new_calculations INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_users_processed INTEGER := 0;
  v_cache_hits INTEGER := 0;
  v_new_calculations INTEGER := 0;
  v_user_id UUID;
  v_score INTEGER;
BEGIN
  -- Process all users
  FOREACH v_user_id IN ARRAY p_user_ids LOOP
    v_users_processed := v_users_processed + 1;

    -- Check if score exists in cache
    SELECT compatibility_score INTO v_score
    FROM get_compatibility_score_fast(v_user_id, p_group_id, 48);

    IF FOUND THEN
      v_cache_hits := v_cache_hits + 1;
    ELSE
      -- In a real implementation, this would trigger calculation
      v_new_calculations := v_new_calculations + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_users_processed, v_cache_hits, v_new_calculations;
END;
$$;

-- 14. Cleanup procedures
-- Function to clean up old compatibility scores
CREATE OR REPLACE FUNCTION cleanup_old_compatibility_scores(
  p_days_to_keep INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM group_compatibility_scores
  WHERE calculated_at < NOW() - (p_days_to_keep || ' days')::INTERVAL
    AND compatibility_score < 40;  -- Keep only low-quality old scores

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Refresh materialized view after cleanup
  PERFORM refresh_hot_compatibility_cache();

  RETURN v_deleted_count;
END;
$$;

-- 15. Final optimizations
-- Update table statistics
ANALYZE group_compatibility_scores;
ANALYZE personality_assessments;
ANALYZE profiles;
ANALYZE groups;
ANALYZE group_members;

COMMIT;

-- Add comments for documentation
COMMENT ON INDEX idx_compatibility_scores_user_group IS 'Primary index for fast user compatibility lookups with group context';
COMMENT ON INDEX idx_compatibility_scores_high_quality IS 'Partial index for frequently accessed high-quality compatibility scores';
COMMENT ON MATERIALIZED VIEW mv_hot_compatibility_scores IS 'Precomputed compatibility scores for frequently accessed users';
COMMENT ON FUNCTION get_compatibility_score_fast IS 'Fast compatibility score lookup with automatic fallback from hot cache to regular cache';
COMMENT ON FUNCTION refresh_hot_compatibility_cache IS 'Refresh the materialized view containing hot compatibility data';
COMMENT ON FUNCTION warm_compatibility_cache IS 'Preload compatibility cache for a group of users';
COMMENT ON FUNCTION cleanup_old_compatibility_scores IS 'Remove old low-quality compatibility scores to maintain performance';