-- WhatsApp Integration Tables
-- Migration: 20250914_010_create_whatsapp_tables

-- Create whatsapp_groups table
CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id TEXT PRIMARY KEY,
    adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_phone_number TEXT NOT NULL,
    invitation_link TEXT,
    members JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending_creation' CHECK (status IN (
        'pending_creation',
        'active',
        'inactive',
        'deleted'
    )),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for whatsapp_groups
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_adventure_id ON whatsapp_groups(adventure_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_admin_user_id ON whatsapp_groups(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_status ON whatsapp_groups(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_created_at ON whatsapp_groups(created_at);

-- Create whatsapp_messages table for logging sent messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id TEXT, -- WhatsApp message ID
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN (
        'text',
        'template',
        'booking_confirmation',
        'trip_reminder',
        'vendor_offer',
        'group_invitation'
    )),
    message_content TEXT,
    template_name TEXT,
    template_params JSONB,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN (
        'sent',
        'delivered',
        'read',
        'failed'
    )),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON whatsapp_messages(sent_at);

-- Create whatsapp_webhooks table for logging webhook events
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT,
    event_type TEXT NOT NULL,
    from_phone TEXT,
    message_id TEXT,
    message_type TEXT,
    message_content TEXT,
    media_id TEXT,
    status TEXT,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for whatsapp_webhooks
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_event_type ON whatsapp_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_from_phone ON whatsapp_webhooks(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_created_at ON whatsapp_webhooks(created_at);

-- Add phone_number column to profiles table if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add WhatsApp preferences to user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS whatsapp_preferences JSONB DEFAULT '{
    "bookingConfirmations": true,
    "tripReminders": true,
    "vendorOffers": true,
    "groupInvitations": true,
    "customerSupport": true
}'::jsonb;

-- Create RLS policies for whatsapp_groups
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view groups they admin
CREATE POLICY "Users can view their WhatsApp groups" ON whatsapp_groups
    FOR SELECT USING (admin_user_id = auth.uid());

-- Policy: Users can create groups for their adventures
CREATE POLICY "Users can create WhatsApp groups" ON whatsapp_groups
    FOR INSERT WITH CHECK (
        admin_user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM adventures a
            INNER JOIN vendors v ON a.vendor_id = v.id
            WHERE a.id = adventure_id AND v.user_id = auth.uid()
        )
    );

-- Policy: Users can update their own groups
CREATE POLICY "Users can update their WhatsApp groups" ON whatsapp_groups
    FOR UPDATE USING (admin_user_id = auth.uid());

-- Policy: Users can soft delete their own groups
CREATE POLICY "Users can delete their WhatsApp groups" ON whatsapp_groups
    FOR UPDATE USING (admin_user_id = auth.uid() AND status = 'deleted');

-- Create RLS policies for whatsapp_messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view their WhatsApp messages" ON whatsapp_messages
    FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can insert their own messages
CREATE POLICY "Users can create WhatsApp messages" ON whatsapp_messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for whatsapp_webhooks (admin only)
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access webhooks
CREATE POLICY "Service role can access WhatsApp webhooks" ON whatsapp_webhooks
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for whatsapp_groups updated_at
CREATE TRIGGER update_whatsapp_groups_updated_at
    BEFORE UPDATE ON whatsapp_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default WhatsApp preferences for existing users
INSERT INTO user_preferences (user_id, whatsapp_notifications, whatsapp_preferences)
SELECT
    id,
    TRUE,
    '{
        "bookingConfirmations": true,
        "tripReminders": true,
        "vendorOffers": true,
        "groupInvitations": true,
        "customerSupport": true
    }'::jsonb
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE whatsapp_notifications IS NOT NULL)
ON CONFLICT (user_id) DO UPDATE SET
    whatsapp_notifications = COALESCE(user_preferences.whatsapp_notifications, TRUE),
    whatsapp_preferences = COALESCE(user_preferences.whatsapp_preferences, EXCLUDED.whatsapp_preferences);

-- Create function to clean up old webhook data (optional cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_webhooks()
RETURNS void AS $$
BEGIN
    DELETE FROM whatsapp_webhooks
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND processed = true;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE whatsapp_groups IS 'Stores WhatsApp group information for travel adventures';
COMMENT ON TABLE whatsapp_messages IS 'Logs all WhatsApp messages sent through the system';
COMMENT ON TABLE whatsapp_webhooks IS 'Stores incoming WhatsApp webhook events for processing';
COMMENT ON COLUMN whatsapp_groups.members IS 'JSON array of group members with name and phone';
COMMENT ON COLUMN whatsapp_groups.status IS 'Group status: pending_creation, active, inactive, deleted';
COMMENT ON COLUMN user_preferences.whatsapp_preferences IS 'User-specific WhatsApp notification preferences';