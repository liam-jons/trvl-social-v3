-- Migration: Enhance Webhook System
-- Description: Add dispute handling tables and enhance webhook event tracking

-- Create booking disputes table for dispute/chargeback tracking
CREATE TABLE booking_disputes (
  id TEXT PRIMARY KEY, -- Stripe dispute ID
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  stripe_charge_id TEXT NOT NULL,

  -- Dispute details
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  reason TEXT NOT NULL,
  status TEXT NOT NULL,

  -- Evidence and deadlines
  evidence_due_by TIMESTAMPTZ,
  evidence_submitted BOOLEAN DEFAULT false,
  evidence_submission_count INTEGER DEFAULT 0,

  -- Resolution details
  resolved_at TIMESTAMPTZ,
  outcome TEXT, -- 'won', 'lost', 'accepted'

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Metadata for additional context
  metadata JSONB DEFAULT '{}'
);

-- Add missing columns to booking_payments for enhanced tracking
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS dispute_status TEXT;
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS refunded_amount INTEGER DEFAULT 0;
ALTER TABLE booking_payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- Enhance stripe_webhook_events table with additional tracking fields
ALTER TABLE stripe_webhook_events ADD COLUMN IF NOT EXISTS retry_after TIMESTAMPTZ;
ALTER TABLE stripe_webhook_events ADD COLUMN IF NOT EXISTS error_category TEXT;
ALTER TABLE stripe_webhook_events ADD COLUMN IF NOT EXISTS alert_sent BOOLEAN DEFAULT false;
ALTER TABLE stripe_webhook_events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create indexes for performance
CREATE INDEX idx_booking_disputes_booking_id ON booking_disputes(booking_id);
CREATE INDEX idx_booking_disputes_charge_id ON booking_disputes(stripe_charge_id);
CREATE INDEX idx_booking_disputes_status ON booking_disputes(status);
CREATE INDEX idx_booking_disputes_evidence_due ON booking_disputes(evidence_due_by);
CREATE INDEX idx_booking_disputes_created_at ON booking_disputes(created_at DESC);

CREATE INDEX idx_webhook_events_retry_after ON stripe_webhook_events(retry_after) WHERE retry_after IS NOT NULL;
CREATE INDEX idx_webhook_events_error_category ON stripe_webhook_events(error_category) WHERE error_category IS NOT NULL;
CREATE INDEX idx_webhook_events_alert_sent ON stripe_webhook_events(alert_sent) WHERE alert_sent = true;

-- Create updated_at trigger for booking_disputes
CREATE TRIGGER update_booking_disputes_updated_at
  BEFORE UPDATE ON booking_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for booking_disputes
ALTER TABLE booking_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_disputes
CREATE POLICY "Users can view disputes for their bookings"
  ON booking_disputes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_disputes.booking_id
    AND (bookings.user_id = auth.uid() OR bookings.vendor_id = auth.uid())
  ));

-- Create helper function to categorize webhook errors
CREATE OR REPLACE FUNCTION categorize_webhook_error(error_message TEXT)
RETURNS TEXT AS $$
BEGIN
  IF error_message IS NULL THEN
    RETURN NULL;
  END IF;

  -- Network/timeout errors
  IF error_message ILIKE '%timeout%' OR error_message ILIKE '%network%' OR error_message ILIKE '%connection%' THEN
    RETURN 'network';
  END IF;

  -- Database errors
  IF error_message ILIKE '%database%' OR error_message ILIKE '%constraint%' OR error_message ILIKE '%foreign key%' THEN
    RETURN 'database';
  END IF;

  -- Validation errors
  IF error_message ILIKE '%validation%' OR error_message ILIKE '%invalid%' OR error_message ILIKE '%required%' THEN
    RETURN 'validation';
  END IF;

  -- Business logic errors
  IF error_message ILIKE '%not found%' OR error_message ILIKE '%already%' OR error_message ILIKE '%duplicate%' THEN
    RETURN 'business_logic';
  END IF;

  -- Default to unknown
  RETURN 'unknown';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to automatically categorize errors when updating webhook events
CREATE OR REPLACE FUNCTION auto_categorize_webhook_error()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_processing_error IS NOT NULL AND NEW.error_category IS NULL THEN
    NEW.error_category = categorize_webhook_error(NEW.last_processing_error);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically categorize webhook errors
CREATE TRIGGER auto_categorize_webhook_error_trigger
  BEFORE UPDATE ON stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION auto_categorize_webhook_error();

-- Create helper function to get webhook processing statistics
CREATE OR REPLACE FUNCTION get_webhook_stats(
  hours_back INTEGER DEFAULT 24
) RETURNS TABLE (
  event_type TEXT,
  total_events BIGINT,
  processed_events BIGINT,
  failed_events BIGINT,
  retry_events BIGINT,
  avg_processing_attempts NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    swe.event_type,
    COUNT(*) as total_events,
    COUNT(CASE WHEN swe.processed = true THEN 1 END) as processed_events,
    COUNT(CASE WHEN swe.processed = false THEN 1 END) as failed_events,
    COUNT(CASE WHEN swe.processing_attempts > 1 THEN 1 END) as retry_events,
    ROUND(AVG(swe.processing_attempts), 2) as avg_processing_attempts,
    ROUND(
      (COUNT(CASE WHEN swe.processed = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100,
      2
    ) as success_rate
  FROM stripe_webhook_events swe
  WHERE swe.created_at >= NOW() - INTERVAL '1 hour' * hours_back
  GROUP BY swe.event_type
  ORDER BY total_events DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get failed webhook events that need attention
CREATE OR REPLACE FUNCTION get_failed_webhooks(
  hours_back INTEGER DEFAULT 24,
  max_attempts INTEGER DEFAULT 5
) RETURNS TABLE (
  stripe_event_id TEXT,
  event_type TEXT,
  processing_attempts INTEGER,
  last_processing_error TEXT,
  error_category TEXT,
  created_at TIMESTAMPTZ,
  retry_after TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    swe.stripe_event_id,
    swe.event_type,
    swe.processing_attempts,
    swe.last_processing_error,
    swe.error_category,
    swe.created_at,
    swe.retry_after
  FROM stripe_webhook_events swe
  WHERE swe.processed = false
    AND swe.processing_attempts >= max_attempts
    AND swe.created_at >= NOW() - INTERVAL '1 hour' * hours_back
    AND swe.alert_sent = false
  ORDER BY swe.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION categorize_webhook_error(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_webhook_stats(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_failed_webhooks(INTEGER, INTEGER) TO authenticated, anon;

-- Create view for webhook monitoring dashboard
CREATE OR REPLACE VIEW webhook_monitoring_dashboard AS
SELECT
  event_type,
  COUNT(*) as total_events,
  COUNT(CASE WHEN processed = true THEN 1 END) as successful_events,
  COUNT(CASE WHEN processed = false THEN 1 END) as failed_events,
  COUNT(CASE WHEN processing_attempts > 1 THEN 1 END) as retry_events,
  ROUND(AVG(processing_attempts), 2) as avg_attempts,
  ROUND(
    (COUNT(CASE WHEN processed = true THEN 1 END)::numeric / COUNT(*)::numeric) * 100,
    2
  ) as success_rate_percent,
  MAX(created_at) as last_event_at
FROM stripe_webhook_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY event_type
ORDER BY total_events DESC;

-- Grant access to the monitoring view
GRANT SELECT ON webhook_monitoring_dashboard TO authenticated, anon;