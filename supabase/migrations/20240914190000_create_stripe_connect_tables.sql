-- Migration: Create Stripe Connect Tables
-- Description: Add tables for Stripe Connect account management and vendor payout tracking

-- Create stripe account status enum
CREATE TYPE stripe_account_status AS ENUM ('created', 'pending', 'active', 'rejected', 'suspended');

-- Create stripe account type enum
CREATE TYPE stripe_account_type AS ENUM ('express', 'custom', 'standard');

-- Create vendor Stripe Connect accounts table
CREATE TABLE vendor_stripe_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL UNIQUE,
  account_type stripe_account_type DEFAULT 'express' NOT NULL,
  status stripe_account_status DEFAULT 'created' NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Account verification status
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,

  -- Requirements and verification data
  requirements_past_due TEXT[],
  requirements_currently_due TEXT[],
  requirements_eventually_due TEXT[],
  verification_status TEXT,

  -- Business information
  business_name TEXT,
  business_type TEXT,
  business_url TEXT,
  support_email TEXT,
  support_phone TEXT,

  -- Payout settings
  payout_schedule_interval TEXT DEFAULT 'daily',
  payout_schedule_delay_days INTEGER DEFAULT 2,
  minimum_payout_amount INTEGER DEFAULT 0,

  -- Platform settings
  platform_fee_percent DECIMAL(4, 2) DEFAULT 5.00,

  -- Metadata and tracking
  onboarding_completed_at TIMESTAMPTZ,
  first_payout_at TIMESTAMPTZ,
  last_updated_from_stripe TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_platform_fee CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 30),
  CONSTRAINT valid_minimum_payout CHECK (minimum_payout_amount >= 0)
);

-- Create vendor payouts tracking table
CREATE TABLE vendor_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_stripe_account_id UUID NOT NULL REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,
  stripe_payout_id TEXT NOT NULL UNIQUE,

  -- Payout details
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL,
  payout_type TEXT DEFAULT 'standard',

  -- Banking details (encrypted/hashed)
  destination_type TEXT,
  destination_last4 TEXT,

  -- Timing
  created_at_stripe TIMESTAMPTZ NOT NULL,
  arrival_date DATE,

  -- Failure information
  failure_code TEXT,
  failure_message TEXT,

  -- Platform tracking
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  booking_count INTEGER DEFAULT 0,
  platform_fee_amount INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create payout line items table (tracks individual bookings in each payout)
CREATE TABLE payout_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES vendor_payouts(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id),
  payment_id UUID REFERENCES booking_payments(id),

  -- Transaction details
  gross_amount INTEGER NOT NULL,
  platform_fee_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Stripe references
  stripe_charge_id TEXT,
  stripe_transfer_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create Stripe webhook events table for tracking and deduplication
CREATE TABLE stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT false,
  processing_attempts INTEGER DEFAULT 0,
  last_processing_error TEXT,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  processed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_vendor_stripe_accounts_user_id ON vendor_stripe_accounts(user_id);
CREATE INDEX idx_vendor_stripe_accounts_vendor_id ON vendor_stripe_accounts(vendor_id);
CREATE INDEX idx_vendor_stripe_accounts_stripe_id ON vendor_stripe_accounts(stripe_account_id);
CREATE INDEX idx_vendor_stripe_accounts_status ON vendor_stripe_accounts(status);
CREATE INDEX idx_vendor_stripe_accounts_created_at ON vendor_stripe_accounts(created_at DESC);

CREATE INDEX idx_vendor_payouts_account_id ON vendor_payouts(vendor_stripe_account_id);
CREATE INDEX idx_vendor_payouts_stripe_id ON vendor_payouts(stripe_payout_id);
CREATE INDEX idx_vendor_payouts_status ON vendor_payouts(status);
CREATE INDEX idx_vendor_payouts_arrival_date ON vendor_payouts(arrival_date);
CREATE INDEX idx_vendor_payouts_created_at ON vendor_payouts(created_at_stripe DESC);

CREATE INDEX idx_payout_line_items_payout_id ON payout_line_items(payout_id);
CREATE INDEX idx_payout_line_items_booking_id ON payout_line_items(booking_id);
CREATE INDEX idx_payout_line_items_payment_id ON payout_line_items(payment_id);

CREATE INDEX idx_stripe_webhook_events_event_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_stripe_webhook_events_processed ON stripe_webhook_events(processed);
CREATE INDEX idx_stripe_webhook_events_created_at ON stripe_webhook_events(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_vendor_stripe_accounts_updated_at
  BEFORE UPDATE ON vendor_stripe_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_payouts_updated_at
  BEFORE UPDATE ON vendor_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE vendor_stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_stripe_accounts
CREATE POLICY "Users can view own Stripe accounts"
  ON vendor_stripe_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own Stripe accounts"
  ON vendor_stripe_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own Stripe accounts"
  ON vendor_stripe_accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for vendor_payouts
CREATE POLICY "Users can view own payouts"
  ON vendor_payouts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendor_stripe_accounts
    WHERE vendor_stripe_accounts.id = vendor_payouts.vendor_stripe_account_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- RLS Policies for payout_line_items
CREATE POLICY "Users can view own payout line items"
  ON payout_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendor_payouts
    JOIN vendor_stripe_accounts ON vendor_stripe_accounts.id = vendor_payouts.vendor_stripe_account_id
    WHERE vendor_payouts.id = payout_line_items.payout_id
    AND vendor_stripe_accounts.user_id = auth.uid()
  ));

-- RLS Policies for stripe_webhook_events (admin only for security)
CREATE POLICY "Only service role can access webhook events"
  ON stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- Add foreign key constraint to existing booking_payments table for Stripe account tracking
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS vendor_stripe_account_id UUID REFERENCES vendor_stripe_accounts(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_booking_payments_vendor_stripe_account ON booking_payments(vendor_stripe_account_id);

-- Create helper function to get vendor Stripe account
CREATE OR REPLACE FUNCTION get_vendor_stripe_account(vendor_user_id UUID)
RETURNS TABLE (
  account_id UUID,
  stripe_account_id TEXT,
  status stripe_account_status,
  charges_enabled BOOLEAN,
  payouts_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vsa.id,
    vsa.stripe_account_id,
    vsa.status,
    vsa.charges_enabled,
    vsa.payouts_enabled
  FROM vendor_stripe_accounts vsa
  WHERE vsa.user_id = vendor_user_id
    AND vsa.status IN ('active', 'pending')
  ORDER BY vsa.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to calculate platform fees
CREATE OR REPLACE FUNCTION calculate_platform_fee(
  amount INTEGER,
  vendor_account_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  fee_percent DECIMAL(4,2) := 5.00; -- Default 5%
BEGIN
  -- Get custom fee rate if vendor account specified
  IF vendor_account_id IS NOT NULL THEN
    SELECT platform_fee_percent INTO fee_percent
    FROM vendor_stripe_accounts
    WHERE id = vendor_account_id;
  END IF;

  -- Calculate fee (rounded)
  RETURN ROUND(amount * fee_percent / 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_vendor_stripe_account(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION calculate_platform_fee(INTEGER, UUID) TO authenticated, anon;