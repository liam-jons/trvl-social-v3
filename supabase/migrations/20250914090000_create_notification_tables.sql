-- Migration: Create Notification System Tables
-- Description: Set up notification infrastructure for push notifications, email fallbacks, and in-app notifications

-- Create notification types enum
CREATE TYPE notification_type AS ENUM (
  'vendor_offer',
  'booking_confirmed',
  'booking_reminder',
  'group_invitation',
  'group_update',
  'trip_request_match',
  'payment_reminder',
  'system_update',
  'marketing',
  'general'
);

-- Create notifications table for storing all notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL,
  icon TEXT,
  data JSONB DEFAULT '{}',
  delivery_results JSONB DEFAULT '[]',
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create notification preferences extension to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily_digest', 'weekly_digest', 'disabled'));
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS vendor_offers_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS booking_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS group_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS marketing_notifications BOOLEAN DEFAULT false;

-- Create notification templates table for reusable templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type notification_type NOT NULL,
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  icon TEXT,
  default_actions JSONB DEFAULT '[]',
  variables JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create notification analytics table for tracking engagement
CREATE TABLE notification_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('delivered', 'opened', 'clicked', 'dismissed', 'converted')),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create FCM tokens table for push notifications
CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type TEXT CHECK (device_type IN ('web', 'ios', 'android')),
  user_agent TEXT,
  active BOOLEAN DEFAULT true,
  last_used TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, token)
);

-- Create notification queue for batch processing
CREATE TABLE notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_data JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notification_analytics_user_id ON notification_analytics(user_id);
CREATE INDEX idx_notification_analytics_event_type ON notification_analytics(event_type);
CREATE INDEX idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(active);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);

-- Create composite indexes for common queries
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX idx_notification_queue_pending ON notification_queue(scheduled_for, status) WHERE status = 'pending';

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for notification templates (public read)
CREATE POLICY "Everyone can view active notification templates"
  ON notification_templates FOR SELECT
  USING (active = true);

-- RLS Policies for FCM tokens
CREATE POLICY "Users can manage own FCM tokens"
  ON fcm_tokens FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for notification analytics
CREATE POLICY "Users can view own notification analytics"
  ON notification_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for notification queue (admin only for most operations)
CREATE POLICY "Users can view own queued notifications"
  ON notification_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT SELECT ON notification_templates TO authenticated, anon;
GRANT ALL ON notification_analytics TO authenticated;
GRANT ALL ON fcm_tokens TO authenticated;
GRANT SELECT ON notification_queue TO authenticated;

-- Insert default notification templates
INSERT INTO notification_templates (name, type, title_template, body_template, icon, default_actions, variables) VALUES
('vendor_offer', 'vendor_offer', '🎯 New Adventure Offer!', '{{vendorName}} has a perfect {{adventureType}} for you!', '/icons/offer.png',
 '[{"action": "view", "title": "View Offer"}, {"action": "dismiss", "title": "Dismiss"}]',
 '["vendorName", "adventureType", "offerId", "vendorId", "adventureId"]'),

('booking_confirmed', 'booking_confirmed', '✅ Booking Confirmed!', 'Your {{adventureName}} booking is confirmed for {{date}}', '/icons/booking.png',
 '[{"action": "view", "title": "View Booking"}]',
 '["adventureName", "date", "bookingId"]'),

('group_invitation', 'group_invitation', '👥 Group Invitation', '{{inviterName}} invited you to join their {{adventureName}} group', '/icons/group.png',
 '[{"action": "accept", "title": "Accept"}, {"action": "decline", "title": "Decline"}]',
 '["inviterName", "adventureName", "groupId", "inviterId"]'),

('trip_request_match', 'trip_request_match', '🎯 Perfect Match Found!', 'We found adventures that match your {{destination}} trip request', '/icons/match.png',
 '[{"action": "view", "title": "View Matches"}]',
 '["destination", "requestId", "matchCount"]'),

('booking_reminder', 'booking_reminder', '⏰ Upcoming Adventure', 'Your {{adventureName}} adventure starts in {{timeUntil}}!', '/icons/reminder.png',
 '[{"action": "view", "title": "View Details"}]',
 '["adventureName", "timeUntil", "bookingId"]'),

('payment_reminder', 'payment_reminder', '💳 Payment Reminder', 'Don''t forget to complete your payment for {{adventureName}}', '/icons/payment.png',
 '[{"action": "pay", "title": "Pay Now"}]',
 '["adventureName", "amount", "bookingId"]');

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to process notification queue
CREATE OR REPLACE FUNCTION process_notification_queue()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  queue_item RECORD;
BEGIN
  -- Process pending notifications that are due
  FOR queue_item IN
    SELECT * FROM notification_queue
    WHERE status = 'pending'
    AND scheduled_for <= NOW()
    AND attempts < max_attempts
    ORDER BY scheduled_for ASC
    LIMIT 100
  LOOP
    -- Update status to processing
    UPDATE notification_queue
    SET status = 'processing',
        attempts = attempts + 1,
        processed_at = NOW()
    WHERE id = queue_item.id;

    -- This would trigger external notification sending
    -- For now, just mark as sent
    UPDATE notification_queue
    SET status = 'sent'
    WHERE id = queue_item.id;

    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;