-- Migration: Create Vendor Forum System Tables
-- Description: Implement forum system for vendor knowledge sharing and community discussions
-- FIXED: Corrected all table and column references to use proper schema

-- Create forum category enum
CREATE TYPE forum_category AS ENUM (
  'marketing',
  'safety',
  'customer_service',
  'pricing_strategies',
  'equipment_maintenance',
  'legal_regulations',
  'insurance',
  'seasonal_tips',
  'technology',
  'general_discussion'
);

-- Create forum threads table
CREATE TABLE vendor_forum_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category forum_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create forum replies table
CREATE TABLE vendor_forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES vendor_forum_threads(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES vendor_forum_replies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_moderated BOOLEAN DEFAULT false,
  is_solution BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create forum votes table
CREATE TABLE vendor_forum_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES vendor_forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES vendor_forum_replies(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('upvote', 'downvote')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(vendor_id, thread_id),
  UNIQUE(vendor_id, reply_id),
  CHECK ((thread_id IS NOT NULL AND reply_id IS NULL) OR (thread_id IS NULL AND reply_id IS NOT NULL))
);

-- Create vendor reputation table
CREATE TABLE vendor_forum_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  helpful_answers INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  solutions_marked INTEGER DEFAULT 0,
  community_contributions INTEGER DEFAULT 0,
  reputation_level TEXT DEFAULT 'newcomer' CHECK (
    reputation_level IN ('newcomer', 'contributor', 'helpful', 'expert', 'mentor')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create forum notifications table
CREATE TABLE vendor_forum_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES vendor_forum_threads(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES vendor_forum_replies(id) ON DELETE CASCADE,
  notification_type TEXT CHECK (notification_type IN (
    'thread_reply', 'reply_mention', 'thread_upvote', 'reply_upvote', 'solution_marked'
  )) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create forum moderation log table
CREATE TABLE vendor_forum_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES vendor_forum_threads(id) ON DELETE SET NULL,
  reply_id UUID REFERENCES vendor_forum_replies(id) ON DELETE SET NULL,
  action_type TEXT CHECK (action_type IN (
    'pin_thread', 'unpin_thread', 'lock_thread', 'unlock_thread',
    'moderate_thread', 'unmoderate_thread', 'moderate_reply', 'unmoderate_reply',
    'mark_solution', 'unmark_solution', 'delete_thread', 'delete_reply'
  )) NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_forum_threads_vendor_id ON vendor_forum_threads(vendor_id);
CREATE INDEX idx_forum_threads_category ON vendor_forum_threads(category);
CREATE INDEX idx_forum_threads_created_at ON vendor_forum_threads(created_at DESC);
CREATE INDEX idx_forum_threads_last_reply_at ON vendor_forum_threads(last_reply_at DESC);
CREATE INDEX idx_forum_threads_upvotes ON vendor_forum_threads(upvotes DESC);
CREATE INDEX idx_forum_threads_tags ON vendor_forum_threads USING GIN(tags);

CREATE INDEX idx_forum_replies_thread_id ON vendor_forum_replies(thread_id);
CREATE INDEX idx_forum_replies_vendor_id ON vendor_forum_replies(vendor_id);
CREATE INDEX idx_forum_replies_parent_reply_id ON vendor_forum_replies(parent_reply_id);
CREATE INDEX idx_forum_replies_created_at ON vendor_forum_replies(created_at DESC);

CREATE INDEX idx_forum_votes_vendor_id ON vendor_forum_votes(vendor_id);
CREATE INDEX idx_forum_votes_thread_id ON vendor_forum_votes(thread_id);
CREATE INDEX idx_forum_votes_reply_id ON vendor_forum_votes(reply_id);

CREATE INDEX idx_forum_reputation_vendor_id ON vendor_forum_reputation(vendor_id);
CREATE INDEX idx_forum_reputation_total_points ON vendor_forum_reputation(total_points DESC);

CREATE INDEX idx_forum_notifications_vendor_id ON vendor_forum_notifications(vendor_id);
CREATE INDEX idx_forum_notifications_unread ON vendor_forum_notifications(vendor_id, is_read);

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_forum_threads_updated_at
  BEFORE UPDATE ON vendor_forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_forum_replies_updated_at
  BEFORE UPDATE ON vendor_forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_forum_reputation_updated_at
  BEFORE UPDATE ON vendor_forum_reputation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update thread reply count and last reply info
CREATE OR REPLACE FUNCTION update_thread_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE vendor_forum_threads
    SET
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_vendor_id = NEW.vendor_id,
      updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE vendor_forum_threads
    SET
      reply_count = GREATEST(reply_count - 1, 0),
      updated_at = NOW()
    WHERE id = OLD.thread_id;

    -- Update last reply info
    UPDATE vendor_forum_threads
    SET
      last_reply_at = (
        SELECT created_at FROM vendor_forum_replies
        WHERE thread_id = OLD.thread_id
        ORDER BY created_at DESC
        LIMIT 1
      ),
      last_reply_vendor_id = (
        SELECT vendor_id FROM vendor_forum_replies
        WHERE thread_id = OLD.thread_id
        ORDER BY created_at DESC
        LIMIT 1
      )
    WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for reply count updates
CREATE TRIGGER update_thread_reply_stats_trigger
  AFTER INSERT OR DELETE ON vendor_forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_reply_stats();

-- Function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.thread_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE vendor_forum_threads SET upvotes = upvotes + 1 WHERE id = NEW.thread_id;
      ELSE
        UPDATE vendor_forum_threads SET downvotes = downvotes + 1 WHERE id = NEW.thread_id;
      END IF;
    ELSIF NEW.reply_id IS NOT NULL THEN
      IF NEW.vote_type = 'upvote' THEN
        UPDATE vendor_forum_replies SET upvotes = upvotes + 1 WHERE id = NEW.reply_id;
      ELSE
        UPDATE vendor_forum_replies SET downvotes = downvotes + 1 WHERE id = NEW.reply_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.thread_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE vendor_forum_threads SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.thread_id;
      ELSE
        UPDATE vendor_forum_threads SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.thread_id;
      END IF;
    ELSIF OLD.reply_id IS NOT NULL THEN
      IF OLD.vote_type = 'upvote' THEN
        UPDATE vendor_forum_replies SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.reply_id;
      ELSE
        UPDATE vendor_forum_replies SET downvotes = GREATEST(downvotes - 1, 0) WHERE id = OLD.reply_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote count updates
CREATE TRIGGER update_vote_counts_trigger
  AFTER INSERT OR DELETE ON vendor_forum_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

-- Enable Row Level Security
ALTER TABLE vendor_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forum_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forum_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forum_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_forum_moderation_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forum threads
CREATE POLICY "Forum threads are viewable by all vendors"
  ON vendor_forum_threads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    JOIN profiles ON vendors.user_id = profiles.id
    WHERE profiles.id = auth.uid() AND vendors.status = 'active'
  ));

CREATE POLICY "Vendors can create forum threads"
  ON vendor_forum_threads FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
    AND vendors.status = 'active'
  ));

CREATE POLICY "Vendors can update own forum threads"
  ON vendor_forum_threads FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for forum replies
CREATE POLICY "Forum replies are viewable by all vendors"
  ON vendor_forum_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    JOIN profiles ON vendors.user_id = profiles.id
    WHERE profiles.id = auth.uid() AND vendors.status = 'active'
  ));

CREATE POLICY "Vendors can create forum replies"
  ON vendor_forum_replies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
    AND vendors.status = 'active'
  ));

CREATE POLICY "Vendors can update own forum replies"
  ON vendor_forum_replies FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for forum votes
CREATE POLICY "Vendors can view all forum votes"
  ON vendor_forum_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    JOIN profiles ON vendors.user_id = profiles.id
    WHERE profiles.id = auth.uid() AND vendors.status = 'active'
  ));

CREATE POLICY "Vendors can manage own forum votes"
  ON vendor_forum_votes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
    AND vendors.status = 'active'
  ));

-- RLS Policies for forum reputation
CREATE POLICY "Forum reputation is viewable by all vendors"
  ON vendor_forum_reputation FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    JOIN profiles ON vendors.user_id = profiles.id
    WHERE profiles.id = auth.uid() AND vendors.status = 'active'
  ));

CREATE POLICY "System can manage vendor reputation"
  ON vendor_forum_reputation FOR ALL
  USING (true);

-- RLS Policies for forum notifications
CREATE POLICY "Vendors can view own forum notifications"
  ON vendor_forum_notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = vendor_id
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "System can manage forum notifications"
  ON vendor_forum_notifications FOR ALL
  USING (true);

-- RLS Policies for moderation log
CREATE POLICY "Moderation log viewable by moderators and admins"
  ON vendor_forum_moderation_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = moderator_vendor_id
    AND vendors.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Moderators can log moderation actions"
  ON vendor_forum_moderation_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors
    WHERE vendors.id = moderator_vendor_id
    AND vendors.user_id = auth.uid()
  ));