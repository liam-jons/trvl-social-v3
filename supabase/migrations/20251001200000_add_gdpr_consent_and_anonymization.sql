-- Migration: Add GDPR Consent Fields and Configure Anonymization
-- Description: Add consent management fields and configure foreign key constraints for GDPR compliance

-- Add consent fields to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS allow_analytics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_personalization BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_third_party_sharing BOOLEAN DEFAULT false;

-- Update existing marketing_emails column to allow_marketing for consistency
ALTER TABLE user_preferences
RENAME COLUMN marketing_emails TO allow_marketing;

-- Create audit log table for consent changes
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('analytics', 'marketing', 'personalization', 'third_party_sharing')),
  previous_value BOOLEAN,
  new_value BOOLEAN NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_consent_audit_log_user_id ON consent_audit_log(user_id);
CREATE INDEX idx_consent_audit_log_changed_at ON consent_audit_log(changed_at DESC);
CREATE INDEX idx_consent_audit_log_consent_type ON consent_audit_log(consent_type);

-- Enable RLS on consent_audit_log
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own consent audit logs
CREATE POLICY "Users can view own consent audit logs"
  ON consent_audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  export_url TEXT,
  expires_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  file_size_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_data_export_requests_user_id ON data_export_requests(user_id);
CREATE INDEX idx_data_export_requests_status ON data_export_requests(status);
CREATE INDEX idx_data_export_requests_expires_at ON data_export_requests(expires_at);

-- Enable RLS on data_export_requests
ALTER TABLE data_export_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own export requests
CREATE POLICY "Users can view own export requests"
  ON data_export_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Create account deletion requests table
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  deletion_id TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_account_deletion_requests_user_id ON account_deletion_requests(user_id);
CREATE INDEX idx_account_deletion_requests_status ON account_deletion_requests(status);
CREATE INDEX idx_account_deletion_requests_deletion_id ON account_deletion_requests(deletion_id);

-- Enable RLS on account_deletion_requests
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own deletion requests
CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

-- ===================================================================
-- CONFIGURE FOREIGN KEY CONSTRAINTS FOR ANONYMIZATION
-- ===================================================================

-- Function to get all tables with foreign keys to profiles
-- This will help us identify which tables need ON DELETE SET NULL vs CASCADE

-- For community_posts: Keep posts but anonymize user_id
-- First, check if the table and constraint exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_posts'
  ) THEN
    -- Drop existing constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'community_posts_user_id_fkey'
      AND table_name = 'community_posts'
    ) THEN
      ALTER TABLE community_posts DROP CONSTRAINT community_posts_user_id_fkey;
    END IF;

    -- Add new constraint with SET NULL on delete
    ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

    -- Make sure user_id can be nullable
    ALTER TABLE community_posts ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- For reviews: Keep reviews but anonymize user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reviews'
  ) THEN
    -- Drop existing constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'reviews_user_id_fkey'
      AND table_name = 'reviews'
    ) THEN
      ALTER TABLE reviews DROP CONSTRAINT reviews_user_id_fkey;
    END IF;

    -- Add new constraint with SET NULL on delete
    ALTER TABLE reviews
    ADD CONSTRAINT reviews_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

    -- Make sure user_id can be nullable
    ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- For community_comments: Keep comments but anonymize user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'community_comments'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'community_comments_user_id_fkey'
      AND table_name = 'community_comments'
    ) THEN
      ALTER TABLE community_comments DROP CONSTRAINT community_comments_user_id_fkey;
    END IF;

    ALTER TABLE community_comments
    ADD CONSTRAINT community_comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

    ALTER TABLE community_comments ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- For vendor_forum_posts: Keep forum posts but anonymize user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vendor_forum_posts'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'vendor_forum_posts_user_id_fkey'
      AND table_name = 'vendor_forum_posts'
    ) THEN
      ALTER TABLE vendor_forum_posts DROP CONSTRAINT vendor_forum_posts_user_id_fkey;
    END IF;

    ALTER TABLE vendor_forum_posts
    ADD CONSTRAINT vendor_forum_posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

    ALTER TABLE vendor_forum_posts ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- For vendor_forum_replies: Keep replies but anonymize user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'vendor_forum_replies'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'vendor_forum_replies_user_id_fkey'
      AND table_name = 'vendor_forum_replies'
    ) THEN
      ALTER TABLE vendor_forum_replies DROP CONSTRAINT vendor_forum_replies_user_id_fkey;
    END IF;

    ALTER TABLE vendor_forum_replies
    ADD CONSTRAINT vendor_forum_replies_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

    ALTER TABLE vendor_forum_replies ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- All other tables with user data should CASCADE (already set up in previous migrations)
-- These include: bookings, trip_requests, messages, notifications, user_preferences, etc.
-- The existing ON DELETE CASCADE constraints will automatically remove these records

-- Create function to log consent changes
CREATE OR REPLACE FUNCTION log_consent_change()
RETURNS TRIGGER AS $$
DECLARE
  consent_field TEXT;
  old_value BOOLEAN;
  new_value BOOLEAN;
BEGIN
  -- Check which consent field changed
  IF NEW.allow_analytics IS DISTINCT FROM OLD.allow_analytics THEN
    consent_field := 'analytics';
    old_value := OLD.allow_analytics;
    new_value := NEW.allow_analytics;
  ELSIF NEW.allow_marketing IS DISTINCT FROM OLD.allow_marketing THEN
    consent_field := 'marketing';
    old_value := OLD.allow_marketing;
    new_value := NEW.allow_marketing;
  ELSIF NEW.allow_personalization IS DISTINCT FROM OLD.allow_personalization THEN
    consent_field := 'personalization';
    old_value := OLD.allow_personalization;
    new_value := NEW.allow_personalization;
  ELSIF NEW.allow_third_party_sharing IS DISTINCT FROM OLD.allow_third_party_sharing THEN
    consent_field := 'third_party_sharing';
    old_value := OLD.allow_third_party_sharing;
    new_value := NEW.allow_third_party_sharing;
  END IF;

  -- If a consent field changed, log it
  IF consent_field IS NOT NULL THEN
    INSERT INTO consent_audit_log (user_id, consent_type, previous_value, new_value)
    VALUES (NEW.user_id, consent_field, old_value, new_value);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log consent changes
DROP TRIGGER IF EXISTS trigger_log_consent_change ON user_preferences;
CREATE TRIGGER trigger_log_consent_change
  AFTER UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_change();

-- Create function to clean up expired export URLs
CREATE OR REPLACE FUNCTION cleanup_expired_exports()
RETURNS void AS $$
BEGIN
  -- Mark expired exports as failed
  UPDATE data_export_requests
  SET status = 'failed',
      error_message = 'Export link expired'
  WHERE status = 'completed'
    AND expires_at < NOW()
    AND expires_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a comment documenting the anonymization strategy
COMMENT ON TABLE community_posts IS 'User-generated content. ON DELETE SET NULL preserves posts for community integrity while anonymizing authorship.';
COMMENT ON TABLE reviews IS 'User reviews. ON DELETE SET NULL preserves reviews for platform integrity while anonymizing authorship.';
COMMENT ON TABLE consent_audit_log IS 'Audit trail of user consent changes for GDPR compliance. Retained for 7 years per legal requirements.';
COMMENT ON TABLE data_export_requests IS 'Tracks user data export requests per GDPR Right to Portability.';
COMMENT ON TABLE account_deletion_requests IS 'Tracks user account deletion requests per GDPR Right to Erasure.';
