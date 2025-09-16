-- Payment Tokens Table - Secure tokens for payment links
-- Adds support for secure payment links for split payment participants

CREATE TABLE payment_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_payment_id UUID NOT NULL REFERENCES individual_payments(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'used', 'expired', 'revoked'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Split Payment Settings Table - Configuration for split payments
CREATE TABLE split_payment_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  split_payment_id UUID NOT NULL REFERENCES split_payments(id) ON DELETE CASCADE,
  reminder_schedule INTEGER[] DEFAULT '{72, 24, 2}', -- Hours before deadline
  auto_enforcement BOOLEAN DEFAULT true,
  minimum_threshold DECIMAL(3,2) DEFAULT 0.8, -- 80%
  fee_handling VARCHAR(20) DEFAULT 'organizer', -- 'organizer', 'split', 'participants'
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_payment_tokens_individual ON payment_tokens(individual_payment_id);
CREATE INDEX idx_payment_tokens_token ON payment_tokens(token);
CREATE INDEX idx_payment_tokens_expires ON payment_tokens(expires_at);
CREATE INDEX idx_payment_tokens_status ON payment_tokens(status);

CREATE INDEX idx_split_payment_settings_split ON split_payment_settings(split_payment_id);

-- Row Level Security
ALTER TABLE payment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payment_settings ENABLE ROW LEVEL SECURITY;

-- Payment Tokens RLS Policies
CREATE POLICY "System can manage payment tokens" ON payment_tokens
  FOR ALL USING (true); -- Controlled by application logic

-- Split Payment Settings RLS Policies
CREATE POLICY "Organizers can manage split payment settings" ON split_payment_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM split_payments sp
      WHERE sp.id = split_payment_id AND sp.organizer_id = auth.uid()
    )
  );

-- Automatic timestamp updates
CREATE TRIGGER update_payment_tokens_modtime
    BEFORE UPDATE ON payment_tokens
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_split_payment_settings_modtime
    BEFORE UPDATE ON split_payment_settings
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_payment_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE payment_tokens
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW();

    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE payment_tokens IS 'Secure tokens for payment links sent to participants. Each token provides access to a specific payment without requiring authentication.';
COMMENT ON TABLE split_payment_settings IS 'Configuration settings for split payment behavior, reminders, and enforcement rules.';
COMMENT ON FUNCTION cleanup_expired_payment_tokens() IS 'Utility function to mark expired payment tokens. Should be called periodically via cron job.';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON payment_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE ON split_payment_settings TO authenticated;