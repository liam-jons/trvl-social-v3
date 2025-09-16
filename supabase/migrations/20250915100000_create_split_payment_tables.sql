-- Split Payment System Migration
-- Creates tables for managing group payment splitting and individual payment tracking

-- Split Payments Table - Master record for group payments
CREATE TABLE split_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_account_id TEXT, -- Stripe Connect account ID
  total_amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  split_type VARCHAR(20) NOT NULL DEFAULT 'equal', -- 'equal', 'custom'
  participant_count INTEGER NOT NULL,
  payment_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'partially_paid', 'completed', 'completed_partial', 'cancelled_insufficient', 'cancelled'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Payments Table - Track each participant's payment
CREATE TABLE individual_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  split_payment_id UUID NOT NULL REFERENCES split_payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_due INTEGER NOT NULL, -- Amount in cents
  amount_paid INTEGER DEFAULT 0, -- Amount actually paid in cents
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'
  stripe_payment_intent_id TEXT, -- Stripe PaymentIntent ID
  payment_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  reminder_count INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Reminders Table - Track reminder schedule and history
CREATE TABLE payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_payment_id UUID NOT NULL REFERENCES individual_payments(id) ON DELETE CASCADE,
  reminder_type VARCHAR(20) NOT NULL, -- 'deadline_approaching', 'deadline_passed', 'final_notice'
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'sent', 'failed', 'cancelled'
  notification_channels JSONB DEFAULT '{"email": true, "push": false}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Refunds Table - Track refund transactions
CREATE TABLE payment_refunds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  individual_payment_id UUID NOT NULL REFERENCES individual_payments(id) ON DELETE CASCADE,
  split_payment_id UUID NOT NULL REFERENCES split_payments(id) ON DELETE CASCADE,
  stripe_refund_id TEXT NOT NULL, -- Stripe Refund ID
  refund_amount INTEGER NOT NULL, -- Amount refunded in cents
  refund_reason VARCHAR(50) NOT NULL, -- 'requested_by_customer', 'duplicate', 'fraudulent'
  status VARCHAR(20) NOT NULL DEFAULT 'processing', -- 'processing', 'succeeded', 'failed', 'cancelled'
  processed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_split_payments_booking ON split_payments(booking_id);
CREATE INDEX idx_split_payments_organizer ON split_payments(organizer_id);
CREATE INDEX idx_split_payments_status ON split_payments(status);
CREATE INDEX idx_split_payments_deadline ON split_payments(payment_deadline);

CREATE INDEX idx_individual_payments_split ON individual_payments(split_payment_id);
CREATE INDEX idx_individual_payments_user ON individual_payments(user_id);
CREATE INDEX idx_individual_payments_status ON individual_payments(status);
CREATE INDEX idx_individual_payments_deadline ON individual_payments(payment_deadline);
CREATE INDEX idx_individual_payments_stripe ON individual_payments(stripe_payment_intent_id);

CREATE INDEX idx_payment_reminders_payment ON payment_reminders(individual_payment_id);
CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_for);
CREATE INDEX idx_payment_reminders_status ON payment_reminders(status);

CREATE INDEX idx_payment_refunds_payment ON payment_refunds(individual_payment_id);
CREATE INDEX idx_payment_refunds_split ON payment_refunds(split_payment_id);
CREATE INDEX idx_payment_refunds_stripe ON payment_refunds(stripe_refund_id);

-- Row Level Security (RLS) Policies
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Split Payments RLS Policies
CREATE POLICY "Users can view split payments they organize or participate in" ON split_payments
  FOR SELECT USING (
    organizer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM individual_payments ip
      WHERE ip.split_payment_id = id AND ip.user_id = auth.uid()
    )
  );

CREATE POLICY "Only organizers can create split payments" ON split_payments
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Only organizers can update their split payments" ON split_payments
  FOR UPDATE USING (organizer_id = auth.uid());

-- Individual Payments RLS Policies
CREATE POLICY "Users can view their own payments or payments they organize" ON individual_payments
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM split_payments sp
      WHERE sp.id = split_payment_id AND sp.organizer_id = auth.uid()
    )
  );

CREATE POLICY "System can insert individual payments" ON individual_payments
  FOR INSERT WITH CHECK (true); -- Controlled by application logic

CREATE POLICY "Users can update their own payment status" ON individual_payments
  FOR UPDATE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM split_payments sp
      WHERE sp.id = split_payment_id AND sp.organizer_id = auth.uid()
    )
  );

-- Payment Reminders RLS Policies
CREATE POLICY "Users can view reminders for their payments" ON payment_reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM individual_payments ip
      WHERE ip.id = individual_payment_id AND (
        ip.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM split_payments sp
          WHERE sp.id = ip.split_payment_id AND sp.organizer_id = auth.uid()
        )
      )
    )
  );

-- Payment Refunds RLS Policies
CREATE POLICY "Users can view refunds for their payments" ON payment_refunds
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM individual_payments ip
      WHERE ip.id = individual_payment_id AND (
        ip.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM split_payments sp
          WHERE sp.id = ip.split_payment_id AND sp.organizer_id = auth.uid()
        )
      )
    )
  );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_split_payments_modtime
    BEFORE UPDATE ON split_payments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_individual_payments_modtime
    BEFORE UPDATE ON individual_payments
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payment_reminders_modtime
    BEFORE UPDATE ON payment_reminders
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payment_refunds_modtime
    BEFORE UPDATE ON payment_refunds
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to automatically update split payment status
CREATE OR REPLACE FUNCTION update_split_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_due INTEGER;
    total_paid INTEGER;
    paid_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Get payment statistics for the split payment
    SELECT
        SUM(amount_due),
        SUM(COALESCE(amount_paid, 0)),
        COUNT(*) FILTER (WHERE status = 'paid'),
        COUNT(*)
    INTO total_due, total_paid, paid_count, total_count
    FROM individual_payments
    WHERE split_payment_id = COALESCE(NEW.split_payment_id, OLD.split_payment_id);

    -- Update split payment status based on individual payment statuses
    UPDATE split_payments
    SET status = CASE
        WHEN paid_count = total_count THEN 'completed'
        WHEN paid_count > 0 THEN 'partially_paid'
        ELSE 'pending'
    END,
    updated_at = NOW()
    WHERE id = COALESCE(NEW.split_payment_id, OLD.split_payment_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to automatically update split payment status
CREATE TRIGGER update_split_payment_status_trigger
    AFTER INSERT OR UPDATE OF status ON individual_payments
    FOR EACH ROW EXECUTE FUNCTION update_split_payment_status();

-- Create views for common queries
CREATE VIEW split_payment_summary AS
SELECT
    sp.id,
    sp.booking_id,
    sp.organizer_id,
    sp.total_amount,
    sp.currency,
    sp.participant_count,
    sp.payment_deadline,
    sp.status as split_status,
    COUNT(ip.id) as total_participants,
    COUNT(ip.id) FILTER (WHERE ip.status = 'paid') as paid_participants,
    COUNT(ip.id) FILTER (WHERE ip.status = 'pending') as pending_participants,
    COUNT(ip.id) FILTER (WHERE ip.status = 'failed') as failed_participants,
    SUM(ip.amount_due) as total_amount_due,
    SUM(COALESCE(ip.amount_paid, 0)) as total_amount_paid,
    (SUM(COALESCE(ip.amount_paid, 0))::FLOAT / NULLIF(SUM(ip.amount_due), 0) * 100) as completion_percentage,
    sp.created_at,
    sp.updated_at
FROM split_payments sp
LEFT JOIN individual_payments ip ON sp.id = ip.split_payment_id
GROUP BY sp.id, sp.booking_id, sp.organizer_id, sp.total_amount, sp.currency, sp.participant_count, sp.payment_deadline, sp.status, sp.created_at, sp.updated_at;

-- Comments for documentation
COMMENT ON TABLE split_payments IS 'Master table for group payment splitting. Each record represents a booking payment that needs to be split among multiple participants.';
COMMENT ON TABLE individual_payments IS 'Individual payment records for each participant in a split payment group. Tracks payment status and Stripe integration.';
COMMENT ON TABLE payment_reminders IS 'Scheduled and sent payment reminders for individual participants.';
COMMENT ON TABLE payment_refunds IS 'Refund transactions for individual payments when group payments fail or are cancelled.';
COMMENT ON VIEW split_payment_summary IS 'Aggregated view of split payment status with participant statistics.';

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON split_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON individual_payments TO authenticated;
GRANT SELECT ON payment_reminders TO authenticated;
GRANT SELECT ON payment_refunds TO authenticated;
GRANT SELECT ON split_payment_summary TO authenticated;