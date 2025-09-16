-- Migration: Create Moderation System Tables
-- Description: Creates tables for content moderation, reporting, and user management

-- Note: Moderation functionality is handled by admin users
-- The 'moderator' role has been removed to avoid enum transaction issues
-- All moderation policies check for 'admin' role instead
-- Column names like 'assigned_moderator' and 'moderator_id' refer to any admin user performing moderation tasks

-- Content Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'review', 'adventure')),
    reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    report_reason TEXT NOT NULL,
    report_category VARCHAR(50) NOT NULL CHECK (report_category IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'hate_speech', 'threats', 'privacy', 'copyright', 'illegal', 'other')),
    description TEXT,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation Queue Table
CREATE TABLE IF NOT EXISTS moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    report_id UUID REFERENCES content_reports(id) ON DELETE CASCADE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    reason VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    assigned_moderator UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Warnings Table
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content_id TEXT,
    content_type VARCHAR(50),
    reason TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    issued_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    custom_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- User Restrictions Table
CREATE TABLE IF NOT EXISTS user_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    restriction_type VARCHAR(30) NOT NULL CHECK (restriction_type IN ('limited', 'suspended', 'banned')),
    reason TEXT NOT NULL,
    restricted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    restricted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT TRUE,
    appeal_id UUID,
    metadata JSONB DEFAULT '{}'
);

-- Moderation Logs Table
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT,
    content_type VARCHAR(50),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    moderator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    automated BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Filter Rules Table
CREATE TABLE IF NOT EXISTS content_filter_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('profanity', 'spam', 'hate_speech', 'threats', 'custom')),
    patterns TEXT[] NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action VARCHAR(30) DEFAULT 'flag' CHECK (action IN ('flag', 'warn', 'block', 'restrict')),
    enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Moderation Appeals Table
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    appeal_type VARCHAR(50) NOT NULL CHECK (appeal_type IN ('content_removal', 'account_warning', 'account_suspension', 'account_ban')),
    original_action_id UUID, -- References the original moderation action
    content_id TEXT,
    content_type VARCHAR(50),
    appeal_reason TEXT NOT NULL,
    appeal_details TEXT,
    supporting_info TEXT,
    evidence_urls TEXT[],
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'escalated')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_moderator UUID REFERENCES profiles(id) ON DELETE SET NULL,
    original_moderator UUID REFERENCES profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Appeal Notes Table
CREATE TABLE IF NOT EXISTS appeal_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID NOT NULL REFERENCES moderation_appeals(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'review' CHECK (note_type IN ('review', 'decision', 'escalation')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Analysis Results Table (for automated filtering)
CREATE TABLE IF NOT EXISTS content_analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    analysis_version VARCHAR(20) DEFAULT '1.0',
    profanity_score DECIMAL(3,2) DEFAULT 0,
    spam_score DECIMAL(3,2) DEFAULT 0,
    toxicity_score DECIMAL(3,2) DEFAULT 0,
    overall_score DECIMAL(3,2) DEFAULT 0,
    violations JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    auto_action VARCHAR(30),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_category ON content_reports(report_category);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_created ON content_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_priority ON moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_assigned ON moderation_queue(assigned_moderator);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created ON moderation_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_expires ON user_warnings(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_warnings_issued ON user_warnings(issued_at);

CREATE INDEX IF NOT EXISTS idx_user_restrictions_user ON user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_type ON user_restrictions(restriction_type);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_active ON user_restrictions(active);
CREATE INDEX IF NOT EXISTS idx_user_restrictions_expires ON user_restrictions(expires_at);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator ON moderation_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_filter_rules_type ON content_filter_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_filter_rules_enabled ON content_filter_rules(enabled);

CREATE INDEX IF NOT EXISTS idx_appeals_status ON moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_user ON moderation_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_assigned ON moderation_appeals(assigned_moderator);
CREATE INDEX IF NOT EXISTS idx_appeals_submitted ON moderation_appeals(submitted_at);

CREATE INDEX IF NOT EXISTS idx_appeal_notes_appeal ON appeal_notes(appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeal_notes_moderator ON appeal_notes(moderator_id);
CREATE INDEX IF NOT EXISTS idx_appeal_notes_created ON appeal_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_content_analysis_content ON content_analysis_results(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_analysis_overall_score ON content_analysis_results(overall_score);
CREATE INDEX IF NOT EXISTS idx_content_analysis_processed ON content_analysis_results(processed_at);

-- Add moderation status column to existing content tables
-- Note: This assumes you have posts, comments, bid_messages, whatsapp_messages, reviews, and adventures tables

-- Add moderation status to posts table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
            CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked', 'under_review'));
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
            CHECK (visibility IN ('public', 'hidden', 'deleted'));
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
        ALTER TABLE posts ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

        CREATE INDEX IF NOT EXISTS idx_posts_moderation_status ON posts(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);
    END IF;
END $$;

-- Add moderation status to comments table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
            CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked', 'under_review'));
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
            CHECK (visibility IN ('public', 'hidden', 'deleted'));
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

        CREATE INDEX IF NOT EXISTS idx_comments_moderation_status ON comments(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_comments_visibility ON comments(visibility);
    END IF;
END $$;

-- Add moderation status to bid_messages table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bid_messages') THEN
        ALTER TABLE bid_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
            CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked', 'under_review'));
        ALTER TABLE bid_messages ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
            CHECK (visibility IN ('public', 'hidden', 'deleted'));
        ALTER TABLE bid_messages ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
        ALTER TABLE bid_messages ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

        CREATE INDEX IF NOT EXISTS idx_bid_messages_moderation_status ON bid_messages(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_bid_messages_visibility ON bid_messages(visibility);
    END IF;
END $$;

-- Add moderation status to whatsapp_messages table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'whatsapp_messages') THEN
        ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved'
            CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'blocked', 'under_review'));
        ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public'
            CHECK (visibility IN ('public', 'hidden', 'deleted'));
        ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
        ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE;

        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_moderation_status ON whatsapp_messages(moderation_status);
        CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_visibility ON whatsapp_messages(visibility);
    END IF;
END $$;

-- Add account status fields to profiles table
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active'
            CHECK (account_status IN ('active', 'limited', 'suspended', 'banned'));
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS restriction_expires TIMESTAMP WITH TIME ZONE;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0;
        ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reputation_score INTEGER DEFAULT 100;

        CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
        CREATE INDEX IF NOT EXISTS idx_profiles_restriction_expires ON profiles(restriction_expires);
    END IF;
END $$;

-- Create RLS (Row Level Security) policies for moderation tables

-- Enable RLS on all moderation tables
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_filter_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_analysis_results ENABLE ROW LEVEL SECURITY;

-- Policies for content_reports
CREATE POLICY "Users can view their own reports" ON content_reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can create reports" ON content_reports
    FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can view all reports" ON content_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update reports" ON content_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for moderation_appeals
CREATE POLICY "Users can view their own appeals" ON moderation_appeals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create appeals" ON moderation_appeals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all appeals" ON moderation_appeals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update appeals" ON moderation_appeals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policies for user_warnings
CREATE POLICY "Users can view their own warnings" ON user_warnings
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage warnings" ON user_warnings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create functions for automated cleanup and maintenance

-- Function to clean up expired warnings
CREATE OR REPLACE FUNCTION cleanup_expired_warnings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mark expired warnings as inactive (don't delete for audit trail)
    UPDATE user_warnings
    SET metadata = metadata || '{"expired": true}'::jsonb
    WHERE expires_at < NOW()
    AND NOT (metadata->>'expired')::boolean;
END;
$$;

-- Function to clean up expired restrictions
CREATE OR REPLACE FUNCTION cleanup_expired_restrictions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Deactivate expired restrictions
    UPDATE user_restrictions
    SET active = FALSE
    WHERE expires_at < NOW()
    AND active = TRUE;

    -- Update profile account status for users with no active restrictions
    UPDATE profiles
    SET account_status = 'active',
        restriction_expires = NULL
    WHERE id IN (
        SELECT DISTINCT user_id
        FROM user_restrictions
        WHERE active = FALSE
        AND user_id NOT IN (
            SELECT user_id
            FROM user_restrictions
            WHERE active = TRUE
        )
    )
    AND account_status != 'active';
END;
$$;

-- Function to update user warning count
CREATE OR REPLACE FUNCTION update_user_warning_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE profiles
        SET warning_count = (
            SELECT COUNT(*)
            FROM user_warnings
            WHERE user_id = NEW.user_id
            AND expires_at > NOW()
        )
        WHERE id = NEW.user_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for warning count updates
CREATE TRIGGER trigger_update_warning_count
    AFTER INSERT ON user_warnings
    FOR EACH ROW
    EXECUTE FUNCTION update_user_warning_count();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for auto-updating timestamps
CREATE TRIGGER trigger_content_reports_updated_at
    BEFORE UPDATE ON content_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_moderation_queue_updated_at
    BEFORE UPDATE ON moderation_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_filter_rules_updated_at
    BEFORE UPDATE ON content_filter_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for moderation statistics
CREATE OR REPLACE VIEW moderation_stats AS
SELECT
    (SELECT COUNT(*) FROM content_reports WHERE status = 'pending') as pending_reports,
    (SELECT COUNT(*) FROM moderation_queue WHERE status = 'pending') as pending_queue_items,
    (SELECT COUNT(*) FROM user_warnings WHERE expires_at > NOW()) as active_warnings,
    (SELECT COUNT(*) FROM user_restrictions WHERE active = TRUE) as active_restrictions,
    (SELECT COUNT(*) FROM moderation_appeals WHERE status = 'pending') as pending_appeals,
    (SELECT COUNT(*) FROM moderation_logs WHERE created_at >= CURRENT_DATE) as actions_today,
    (SELECT COUNT(*) FROM content_reports WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as reports_week,
    (SELECT COUNT(*) FROM moderation_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as actions_week;

-- Grant necessary permissions
GRANT SELECT ON moderation_stats TO authenticated;

-- Insert default content filter rules
INSERT INTO content_filter_rules (name, rule_type, patterns, severity, action, description, enabled) VALUES
('Basic Profanity Filter', 'profanity', ARRAY['damn', 'hell', 'crap'], 'low', 'flag', 'Basic inappropriate language detection', true),
('Spam Keywords', 'spam', ARRAY['click here', 'buy now', 'limited time', 'free money', 'make money fast'], 'medium', 'block', 'Common spam and promotional phrases', true),
('Hate Speech Detection', 'hate_speech', ARRAY['hate', 'discriminatory language placeholder'], 'high', 'block', 'Detects hate speech and discriminatory content', true),
('Threat Detection', 'threats', ARRAY['kill', 'die', 'harm', 'violence'], 'critical', 'block', 'Detects threats and violent language', true)
ON CONFLICT DO NOTHING;

-- Add comments to tables for documentation
COMMENT ON TABLE content_reports IS 'User reports of inappropriate content';
COMMENT ON TABLE moderation_queue IS 'Queue of content items requiring moderation review';
COMMENT ON TABLE user_warnings IS 'Warnings issued to users for policy violations';
COMMENT ON TABLE user_restrictions IS 'Account restrictions and bans';
COMMENT ON TABLE moderation_logs IS 'Log of all moderation actions taken';
COMMENT ON TABLE content_filter_rules IS 'Automated content filtering rules';
COMMENT ON TABLE moderation_appeals IS 'User appeals for moderation decisions';
COMMENT ON TABLE appeal_notes IS 'Moderator notes on appeals';
COMMENT ON TABLE content_analysis_results IS 'Results from automated content analysis';