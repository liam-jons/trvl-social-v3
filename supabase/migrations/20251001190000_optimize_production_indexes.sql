-- Migration: Optimize Production Indexes
-- Created: 2025-10-01
-- Purpose: Add critical indexes for production performance optimization
--          Based on common query patterns and expected workload
-- Note: CONCURRENTLY removed as it cannot run in transactions (Supabase migration limitation)

-- =============================================================================
-- PHASE 1: CRITICAL INDEXES (Highest Traffic)
-- =============================================================================

-- User Lookups (Authentication & Profile Queries)
-- These are hit on every authenticated request
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles(username)
  WHERE username IS NOT NULL;

-- Note: email column is in auth.users, not profiles table
-- CREATE INDEX IF NOT EXISTS idx_profiles_email
--   ON profiles(email)
--   WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

-- Composite index for active users
CREATE INDEX IF NOT EXISTS idx_profiles_active_created
  ON profiles(created_at DESC)
  WHERE role != 'admin';

-- Adventure Search & Discovery (Public-Facing)
-- Critical for homepage and search functionality
CREATE INDEX IF NOT EXISTS idx_adventures_category
  ON adventures(category)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_adventures_location
  ON adventures(location)
  WHERE is_active = true;

-- Composite index for filtered adventure listings
CREATE INDEX IF NOT EXISTS idx_adventures_active_rating
  ON adventures(is_active, rating DESC, created_at DESC)
  WHERE is_active = true;

-- Vendor lookups
CREATE INDEX IF NOT EXISTS idx_adventures_vendor_id
  ON adventures(vendor_id)
  WHERE is_active = true;

-- Booking System (Core Business Logic)
-- High frequency for both users and vendors
CREATE INDEX IF NOT EXISTS idx_bookings_user_id
  ON bookings(user_id, booking_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id
  ON bookings(vendor_id, booking_date DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_adventure_id
  ON bookings(adventure_id, booking_date DESC);

-- Composite index for booking status queries
CREATE INDEX IF NOT EXISTS idx_bookings_status_date
  ON bookings(status, booking_date DESC)
  WHERE status IN ('pending', 'confirmed', 'in_progress');

-- Payment Processing (Critical for Revenue)
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id
  ON booking_payments(booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_payments_status
  ON booking_payments(payment_status, created_at DESC)
  WHERE payment_status IN ('pending', 'processing', 'requires_action');

CREATE INDEX IF NOT EXISTS idx_booking_payments_stripe_intent
  ON booking_payments(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- =============================================================================
-- PHASE 2: SOCIAL FEATURE INDEXES
-- =============================================================================

-- User Connections (Friend System)
CREATE INDEX IF NOT EXISTS idx_user_connections_user_id
  ON user_connections(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_connections_connected_user_id
  ON user_connections(connected_user_id, status);

-- Composite index for mutual connection queries
CREATE INDEX IF NOT EXISTS idx_user_connections_status_created
  ON user_connections(status, created_at DESC)
  WHERE status = 'accepted';

-- Posts & Feed (Social Content)
CREATE INDEX IF NOT EXISTS idx_posts_author_id
  ON posts(author_id, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_posts_created_at
  ON posts(created_at DESC)
  WHERE is_deleted = false AND visibility = 'public';

-- Post Engagement
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id
  ON post_likes(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_likes_user_id
  ON post_likes(user_id, created_at DESC);

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id
  ON comments(post_id, created_at DESC)
  WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_comments_author_id
  ON comments(author_id, created_at DESC);

-- Community Feed
CREATE INDEX IF NOT EXISTS idx_community_feed_user_id
  ON community_feed_items(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_feed_relevance
  ON community_feed_items(user_id, relevance_score DESC, created_at DESC);

-- =============================================================================
-- PHASE 3: NOTIFICATIONS & MESSAGING
-- =============================================================================

-- Notifications (High Frequency Reads)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread
  ON notifications(user_id, created_at DESC)
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_type
  ON notifications(notification_type, created_at DESC);

-- Notification Settings
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id
  ON notification_settings(user_id);

-- WhatsApp Integration
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id
  ON whatsapp_conversations(user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id
  ON whatsapp_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status
  ON whatsapp_messages(status, created_at DESC)
  WHERE status IN ('pending', 'sent');

-- =============================================================================
-- PHASE 4: VENDOR & BUSINESS OPERATIONS
-- =============================================================================

-- Vendor Management
CREATE INDEX IF NOT EXISTS idx_vendors_user_id
  ON vendors(user_id);

CREATE INDEX IF NOT EXISTS idx_vendors_status
  ON vendors(vendor_status, created_at DESC);

-- Vendor Certifications
CREATE INDEX IF NOT EXISTS idx_vendor_certifications_vendor_id
  ON vendor_certifications(vendor_id, expiry_date)
  WHERE is_active = true;

-- Adventure Availability
CREATE INDEX IF NOT EXISTS idx_adventure_availability_adventure_id
  ON adventure_availability(adventure_id, start_date);

CREATE INDEX IF NOT EXISTS idx_adventure_availability_dates
  ON adventure_availability(start_date, end_date)
  WHERE is_available = true;

-- Adventure Media
CREATE INDEX IF NOT EXISTS idx_adventure_media_adventure_id
  ON adventure_media(adventure_id, display_order);

-- Reviews & Ratings
CREATE INDEX IF NOT EXISTS idx_reviews_adventure_id_rating
  ON reviews(adventure_id, rating DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id
  ON reviews(vendor_id, rating DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON reviews(user_id, created_at DESC);

-- =============================================================================
-- PHASE 5: GROUP & COMPATIBILITY SYSTEM
-- =============================================================================

-- Groups
CREATE INDEX IF NOT EXISTS idx_groups_owner_id
  ON groups(owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_groups_visibility
  ON groups(visibility, created_at DESC)
  WHERE visibility = 'public';

-- Group Members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id
  ON group_members(group_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id
  ON group_members(user_id, joined_at DESC);

-- Personality Assessments (for Matching)
CREATE INDEX IF NOT EXISTS idx_personality_assessments_user_id
  ON personality_assessments(user_id, assessment_date DESC);

-- Composite index for personality-based queries
CREATE INDEX IF NOT EXISTS idx_personality_traits
  ON personality_assessments(openness, conscientiousness, extraversion, agreeableness, neuroticism);

-- Compatibility Scores
CREATE INDEX IF NOT EXISTS idx_compatibility_scores_user_id
  ON compatibility_scores(user_id, compatibility_score DESC);

CREATE INDEX IF NOT EXISTS idx_compatibility_scores_target_user_id
  ON compatibility_scores(target_user_id, compatibility_score DESC);

-- Travel Preferences
CREATE INDEX IF NOT EXISTS idx_travel_preferences_user_id
  ON travel_preferences(user_id);

-- =============================================================================
-- PHASE 6: PAYMENT & FINANCIAL OPERATIONS
-- =============================================================================

-- Stripe Integration
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_vendor_id
  ON stripe_accounts(vendor_id);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_account_id
  ON stripe_accounts(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- Payment Splits (Group Bookings)
CREATE INDEX IF NOT EXISTS idx_payment_splits_booking_id
  ON payment_splits(booking_id);

CREATE INDEX IF NOT EXISTS idx_payment_splits_user_id
  ON payment_splits(user_id, payment_status);

CREATE INDEX IF NOT EXISTS idx_payment_splits_deadline
  ON payment_splits(payment_deadline)
  WHERE payment_status IN ('pending', 'overdue');

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id
  ON invoices(vendor_id, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id
  ON invoices(booking_id);

-- Refunds & Disputes
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking_id
  ON refund_requests(booking_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refund_requests_status
  ON refund_requests(status, created_at DESC)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX IF NOT EXISTS idx_dispute_cases_booking_id
  ON dispute_cases(booking_id, created_at DESC);

-- =============================================================================
-- PHASE 7: MODERATION & COMPLIANCE
-- =============================================================================

-- Content Moderation
CREATE INDEX IF NOT EXISTS idx_content_reports_status
  ON content_reports(status, created_at DESC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_content_reports_content_id
  ON content_reports(content_id, content_type);

-- Age Verification (COPPA Compliance)
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id
  ON age_verification_logs(user_id, verification_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_age_verification_logs_status
  ON age_verification_logs(verification_status, verification_timestamp DESC);

-- Compliance Logs
CREATE INDEX IF NOT EXISTS idx_compliance_logs_user_id
  ON compliance_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_event_type
  ON compliance_logs(event_type, logged_at DESC);

-- =============================================================================
-- PHASE 8: ANALYTICS & TRACKING
-- =============================================================================

-- Engagement Metrics
CREATE INDEX IF NOT EXISTS idx_engagement_metrics_user_id
  ON engagement_metrics(user_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_engagement_metrics_date
  ON engagement_metrics(metric_date DESC);

-- User Activity Logs
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id
  ON user_activity_logs(user_id, activity_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type
  ON user_activity_logs(activity_type, activity_timestamp DESC);

-- Content Views
CREATE INDEX IF NOT EXISTS idx_content_views_content_id
  ON content_views(content_id, content_type, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_views_user_id
  ON content_views(user_id, viewed_at DESC);

-- =============================================================================
-- PHASE 9: VENDOR FORUM & COMMUNITY
-- =============================================================================

-- Forum Categories
CREATE INDEX IF NOT EXISTS idx_forum_categories_parent_id
  ON forum_categories(parent_category_id, display_order);

-- Forum Topics
CREATE INDEX IF NOT EXISTS idx_forum_topics_category_id
  ON forum_topics(category_id, last_post_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_topics_author_id
  ON forum_topics(author_id, created_at DESC);

-- Forum Posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id
  ON forum_posts(topic_id, created_at);

CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id
  ON forum_posts(author_id, created_at DESC);

-- =============================================================================
-- ANALYZE TABLES FOR UPDATED STATISTICS
-- =============================================================================

-- Update table statistics for query planner optimization
ANALYZE profiles;
ANALYZE adventures;
ANALYZE bookings;
ANALYZE booking_payments;
ANALYZE vendors;
ANALYZE user_connections;
ANALYZE posts;
ANALYZE notifications;
ANALYZE groups;
ANALYZE group_members;
ANALYZE payment_splits;
ANALYZE reviews;
ANALYZE personality_assessments;
ANALYZE compatibility_scores;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- To verify indexes were created:
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- To find tables missing indexes on foreign keys:
-- SELECT
--   c.conrelid::regclass AS table_name,
--   a.attname AS column_name,
--   c.contype AS constraint_type
-- FROM pg_constraint c
-- JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
-- WHERE c.contype = 'f'
-- AND NOT EXISTS (
--   SELECT 1 FROM pg_index i
--   WHERE i.indrelid = c.conrelid
--   AND a.attnum = ANY(i.indkey)
-- );

COMMENT ON INDEX idx_profiles_username IS 'Optimize user lookup by username (authentication)';
COMMENT ON INDEX idx_adventures_active_rating IS 'Optimize adventure search and sorting by rating';
COMMENT ON INDEX idx_bookings_status_date IS 'Optimize booking status queries for vendor dashboard';
COMMENT ON INDEX idx_notifications_user_id_unread IS 'Optimize unread notification queries';
COMMENT ON INDEX idx_payment_splits_deadline IS 'Optimize payment reminder queries';
