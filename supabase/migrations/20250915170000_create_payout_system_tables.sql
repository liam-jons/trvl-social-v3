-- Migration: Create Payout System Tables
-- Description: Create tables for automated payout system, holds, and failure tracking

-- Create payout hold status enum
CREATE TYPE payout_hold_status AS ENUM ('active', 'released', 'expired');

-- Create payout hold type enum
CREATE TYPE payout_hold_type AS ENUM ('manual', 'automatic', 'dispute', 'compliance', 'risk');

-- Create payout status enum
CREATE TYPE payout_status AS ENUM ('pending', 'eligible', 'paid_out', 'held', 'failed');

-- Note: payout_holds table is also created in reconciliation migration
-- Using IF NOT EXISTS to avoid conflicts
CREATE TABLE IF NOT EXISTS payout_holds_system (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_stripe_account_id UUID NOT NULL REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,

  -- Hold details
  type payout_hold_type NOT NULL DEFAULT 'manual',
  reason TEXT NOT NULL,
  description TEXT,
  status payout_hold_status NOT NULL DEFAULT 'active',

  -- Timing
  placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  release_date TIMESTAMPTZ, -- null for indefinite hold
  released_at TIMESTAMPTZ,

  -- Management
  placed_by TEXT, -- user ID or 'system'
  released_by TEXT, -- user ID or 'system'
  release_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_release_timing CHECK (released_at IS NULL OR released_at >= placed_at),
  CONSTRAINT valid_release_date CHECK (release_date IS NULL OR release_date >= placed_at)
);

-- Create payout hold logs table for audit trail
CREATE TABLE payout_hold_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hold_id UUID NOT NULL REFERENCES payout_holds(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'placed', 'released', 'updated', 'extended'
  details JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payout failures table
CREATE TABLE payout_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_stripe_account_id UUID NOT NULL REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,

  -- Failure details
  error_message TEXT NOT NULL,
  error_code TEXT,
  error_details JSONB DEFAULT '{}',

  -- Retry information
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ,

  -- Status
  resolved BOOLEAN DEFAULT false,
  requires_manual_review BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create payout schedule jobs table (for tracking scheduled payouts)
CREATE TABLE payout_schedule_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_stripe_account_id UUID NOT NULL REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,

  -- Schedule details
  schedule_interval TEXT NOT NULL DEFAULT 'weekly',
  next_execution TIMESTAMPTZ NOT NULL,
  last_executed TIMESTAMPTZ,

  -- Job status
  status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'processing', 'completed', 'failed', 'disabled'
  retry_count INTEGER DEFAULT 0,

  -- Execution metadata
  execution_metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add payout_status column to booking_payments if it doesn't exist
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS payout_status payout_status DEFAULT 'pending';
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES vendor_payouts(id);
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS payout_date TIMESTAMPTZ;

-- Create system settings table for configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payout_holds_system_vendor_account_id ON payout_holds_system(vendor_stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_payout_holds_system_status ON payout_holds_system(status);
CREATE INDEX IF NOT EXISTS idx_payout_holds_system_type ON payout_holds_system(type);
CREATE INDEX IF NOT EXISTS idx_payout_holds_system_placed_at ON payout_holds_system(placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_holds_system_release_date ON payout_holds_system(release_date);

CREATE INDEX idx_payout_hold_logs_hold_id ON payout_hold_logs(hold_id);
CREATE INDEX idx_payout_hold_logs_timestamp ON payout_hold_logs(timestamp DESC);

CREATE INDEX idx_payout_failures_vendor_account_id ON payout_failures(vendor_stripe_account_id);
CREATE INDEX idx_payout_failures_resolved ON payout_failures(resolved);
CREATE INDEX idx_payout_failures_requires_manual_review ON payout_failures(requires_manual_review);
CREATE INDEX idx_payout_failures_next_retry_at ON payout_failures(next_retry_at);

CREATE INDEX idx_payout_schedule_jobs_vendor_account_id ON payout_schedule_jobs(vendor_stripe_account_id);
CREATE INDEX idx_payout_schedule_jobs_status ON payout_schedule_jobs(status);
CREATE INDEX idx_payout_schedule_jobs_next_execution ON payout_schedule_jobs(next_execution);

CREATE INDEX idx_booking_payments_payout_status ON booking_payments(payout_status);
CREATE INDEX idx_booking_payments_payout_id ON booking_payments(payout_id);
CREATE INDEX idx_booking_payments_vendor_payout_lookup ON booking_payments(vendor_stripe_account_id, payout_status, created_at);

CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Create triggers for updated_at
CREATE TRIGGER update_payout_holds_system_updated_at
  BEFORE UPDATE ON payout_holds_system
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_failures_updated_at
  BEFORE UPDATE ON payout_failures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payout_schedule_jobs_updated_at
  BEFORE UPDATE ON payout_schedule_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE payout_holds_system ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_hold_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_schedule_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payout_holds_system
CREATE POLICY "Users can view own payout holds"
  ON payout_holds_system FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendor_stripe_accounts
    WHERE vendor_stripe_accounts.id = payout_holds_system.vendor_stripe_account_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- Admins can manage all holds
CREATE POLICY "Admins can manage all payout holds"
  ON payout_holds_system FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (
           SELECT 1 FROM profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role = 'admin'
         ));

-- RLS Policies for payout_hold_logs
CREATE POLICY "Users can view own payout hold logs"
  ON payout_hold_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM payout_holds
    JOIN vendor_stripe_accounts ON vendor_stripe_accounts.id = payout_holds.vendor_stripe_account_id
    WHERE payout_holds.id = payout_hold_logs.hold_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- RLS Policies for payout_failures
CREATE POLICY "Users can view own payout failures"
  ON payout_failures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendor_stripe_accounts
    WHERE vendor_stripe_accounts.id = payout_failures.vendor_stripe_account_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- RLS Policies for payout_schedule_jobs
CREATE POLICY "Users can view own payout schedule jobs"
  ON payout_schedule_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendor_stripe_accounts
    WHERE vendor_stripe_accounts.id = payout_schedule_jobs.vendor_stripe_account_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- RLS Policies for system_settings (admin only)
CREATE POLICY "Only admins can access system settings"
  ON system_settings FOR ALL
  USING (auth.role() = 'service_role' OR
         EXISTS (
           SELECT 1 FROM profiles
           WHERE profiles.id = auth.uid()
           AND profiles.role = 'admin'
         ));

-- Create helper function to check if vendor has active hold
CREATE OR REPLACE FUNCTION has_active_payout_hold(vendor_account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM payout_holds_system
    WHERE vendor_stripe_account_id = vendor_account_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get pending payout amount
CREATE OR REPLACE FUNCTION get_pending_payout_amount(vendor_account_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_amount INTEGER := 0;
BEGIN
  -- Note: booking_payments table doesn't have net_amount column
  -- Calculate net amount from amount minus platform fees
  SELECT COALESCE(SUM(amount - COALESCE(platform_fee_amount, 0)), 0) INTO total_amount
  FROM booking_payments
  WHERE vendor_stripe_account_id = vendor_account_id
    AND status = 'completed'
    AND payout_status IN ('pending', 'eligible');

  RETURN total_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to mark payments as eligible for payout
CREATE OR REPLACE FUNCTION mark_payments_eligible_for_payout()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Mark payments as eligible after 24 hours (configurable hold period)
  UPDATE booking_payments
  SET payout_status = 'eligible'
  WHERE status = 'completed'
    AND payout_status = 'pending'
    AND created_at <= NOW() - INTERVAL '24 hours'
    AND NOT has_active_payout_hold(vendor_stripe_account_id);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('payout_scheduler_config', '{"enabled": true, "schedule": "weekly", "minimumAmount": 2000, "maxRetries": 3}', 'Global payout scheduler configuration'),
  ('payout_hold_defaults', '{"defaultHoldPeriod": 0, "autoReleaseExpiredHolds": true}', 'Default payout hold settings'),
  ('payout_processing_limits', '{"maxBatchSize": 100, "maxConcurrentProcessors": 3, "processingTimeout": 300000}', 'Payout processing limits and timeouts')
ON CONFLICT (setting_key) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION has_active_payout_hold(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_pending_payout_amount(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION mark_payments_eligible_for_payout() TO service_role;

-- Create a scheduled job function for marking payments eligible (to be called by cron)
CREATE OR REPLACE FUNCTION process_payout_eligibility()
RETURNS void AS $$
BEGIN
  -- Mark payments eligible for payout
  PERFORM mark_payments_eligible_for_payout();

  -- Process expired holds
  UPDATE payout_holds_system
  SET status = 'expired',
      released_at = NOW(),
      release_reason = 'Automatic expiry'
  WHERE status = 'active'
    AND release_date IS NOT NULL
    AND release_date <= NOW();

  -- Log the processing
  INSERT INTO system_logs (event_type, details, created_at)
  VALUES ('payout_eligibility_processed', '{"processed_at": "' || NOW() || '"}', NOW())
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_payout_eligibility() TO service_role;