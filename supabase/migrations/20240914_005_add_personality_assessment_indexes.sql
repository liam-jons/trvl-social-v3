-- Migration: Add Performance Indexes for Personality Assessments
-- Description: Create indexes for efficient querying by user_id and assessment_date

-- Index for efficient lookup by assessment completion date
-- Useful for querying assessments within date ranges
CREATE INDEX IF NOT EXISTS idx_personality_assessments_completed_at
ON personality_assessments(completed_at DESC);

-- Index for querying recent assessments (most common query pattern)
-- Combines completed_at ordering with user filtering for dashboard queries
CREATE INDEX IF NOT EXISTS idx_personality_assessments_completed_at_user_id
ON personality_assessments(completed_at DESC, user_id);

-- Index for efficient lookup by updated timestamp
-- Useful for sync operations and change tracking
CREATE INDEX IF NOT EXISTS idx_personality_assessments_updated_at
ON personality_assessments(updated_at DESC);

-- Composite index for date range queries with user filtering
-- Optimizes queries like "get all assessments for user X between dates Y and Z"
CREATE INDEX IF NOT EXISTS idx_personality_assessments_user_date_range
ON personality_assessments(user_id, completed_at DESC);

-- Index for assessment responses by user (for efficient joins)
-- Improves performance when fetching assessment details with responses
CREATE INDEX IF NOT EXISTS idx_assessment_responses_user_question
ON assessment_responses(user_id, question_id);

-- Index for assessment responses by creation date
-- Useful for analytics and temporal queries on response patterns
CREATE INDEX IF NOT EXISTS idx_assessment_responses_created_at
ON assessment_responses(created_at DESC);

-- Partial index for active assessments only (if we add is_active column later)
-- This would be useful if we soft-delete assessments or have draft states
-- CREATE INDEX IF NOT EXISTS idx_personality_assessments_active
-- ON personality_assessments(user_id, completed_at DESC) WHERE is_active = true;

-- Index for personality trait-based queries (for compatibility matching)
-- Useful for finding users with similar personality profiles
CREATE INDEX IF NOT EXISTS idx_personality_assessments_traits
ON personality_assessments(openness, conscientiousness, extraversion, agreeableness, neuroticism);

-- Index for travel preference queries (for group formation)
-- Optimizes queries that match users by travel preferences
CREATE INDEX IF NOT EXISTS idx_personality_assessments_travel_prefs
ON personality_assessments(adventure_style, group_preference, planning_style);

-- Comment on indexes for documentation
COMMENT ON INDEX idx_personality_assessments_completed_at
IS 'Primary index for time-based queries on assessment completion';

COMMENT ON INDEX idx_personality_assessments_completed_at_user_id
IS 'Composite index for user-specific assessment history queries';

COMMENT ON INDEX idx_personality_assessments_user_date_range
IS 'Optimized for date range queries filtered by user';

COMMENT ON INDEX idx_assessment_responses_user_question
IS 'Efficient lookup of responses by user and question for joins';

COMMENT ON INDEX idx_personality_assessments_traits
IS 'Enables efficient similarity matching based on Big Five traits';

COMMENT ON INDEX idx_personality_assessments_travel_prefs
IS 'Supports group formation queries based on travel preferences';