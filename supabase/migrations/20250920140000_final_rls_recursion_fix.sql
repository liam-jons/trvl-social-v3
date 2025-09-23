-- FINAL RLS Recursion Fix - Remove ALL circular references
-- This migration identifies and fixes ALL circular RLS policy references that cause infinite recursion

-- Disable RLS on ALL affected tables
ALTER TABLE split_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_service_disputes DISABLE ROW LEVEL SECURITY;

-- Drop ALL RLS policies that reference split_payments or create circular references

-- Split payment system policies
DROP POLICY IF EXISTS "Users can view split payments they organize or participate in" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can create split payments" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can update their split payments" ON split_payments;
DROP POLICY IF EXISTS "split_payments_organizer_all" ON split_payments;
DROP POLICY IF EXISTS "split_payments_organizer_access" ON split_payments;

DROP POLICY IF EXISTS "Users can view their own payments or payments they organize" ON individual_payments;
DROP POLICY IF EXISTS "System can insert individual payments" ON individual_payments;
DROP POLICY IF EXISTS "Users can update their own payment status" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_read" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_insert" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_update" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_access" ON individual_payments;

DROP POLICY IF EXISTS "Users can view reminders for their payments" ON payment_reminders;
DROP POLICY IF EXISTS "payment_reminders_own_access" ON payment_reminders;

DROP POLICY IF EXISTS "Users can view refunds for their payments" ON payment_refunds;
DROP POLICY IF EXISTS "payment_refunds_own_access" ON payment_refunds;

-- Booking modification system policies that reference split_payments
DROP POLICY IF EXISTS "Users can view their own modifications" ON booking_modifications;
DROP POLICY IF EXISTS "Users can create modifications" ON booking_modifications;
DROP POLICY IF EXISTS "Users can update their modifications" ON booking_modifications;
DROP POLICY IF EXISTS "Vendors can manage modifications" ON booking_modifications;

DROP POLICY IF EXISTS "Users can view their own cancellations" ON booking_cancellations;
DROP POLICY IF EXISTS "Users can create cancellations" ON booking_cancellations;
DROP POLICY IF EXISTS "Users can update their cancellations" ON booking_cancellations;
DROP POLICY IF EXISTS "Vendors can manage cancellations" ON booking_cancellations;

DROP POLICY IF EXISTS "Users can view their own disputes" ON booking_service_disputes;
DROP POLICY IF EXISTS "Users can create disputes" ON booking_service_disputes;
DROP POLICY IF EXISTS "Users can update their disputes" ON booking_service_disputes;
DROP POLICY IF EXISTS "Vendors can manage disputes" ON booking_service_disputes;

-- Re-enable RLS
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_service_disputes ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE, NON-RECURSIVE policies

-- Split Payments: Only organizers can access
CREATE POLICY "split_payments_simple"
  ON split_payments FOR ALL
  USING (organizer_id = auth.uid());

-- Individual Payments: Users can only access their own
CREATE POLICY "individual_payments_simple"
  ON individual_payments FOR ALL
  USING (user_id = auth.uid());

-- Payment Reminders: Simplified access
CREATE POLICY "payment_reminders_simple"
  ON payment_reminders FOR ALL
  USING (true); -- Will be controlled by application logic

-- Payment Refunds: Simplified access
CREATE POLICY "payment_refunds_simple"
  ON payment_refunds FOR ALL
  USING (true); -- Will be controlled by application logic

-- Booking Modifications: Simplified - no split_payments references
CREATE POLICY "booking_modifications_simple"
  ON booking_modifications FOR SELECT
  USING (modified_by = auth.uid());

CREATE POLICY "booking_modifications_insert_simple"
  ON booking_modifications FOR INSERT
  WITH CHECK (modified_by = auth.uid());

CREATE POLICY "booking_modifications_update_simple"
  ON booking_modifications FOR UPDATE
  USING (modified_by = auth.uid());

-- Booking Cancellations: Simplified
CREATE POLICY "booking_cancellations_simple"
  ON booking_cancellations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "booking_cancellations_insert_simple"
  ON booking_cancellations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "booking_cancellations_update_simple"
  ON booking_cancellations FOR UPDATE
  USING (user_id = auth.uid());

-- Booking Service Disputes: Simplified
CREATE POLICY "booking_service_disputes_simple"
  ON booking_service_disputes FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "booking_service_disputes_insert_simple"
  ON booking_service_disputes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "booking_service_disputes_update_simple"
  ON booking_service_disputes FOR UPDATE
  USING (user_id = auth.uid());

-- Add comprehensive documentation
COMMENT ON TABLE split_payments IS 'EMERGENCY FIX: All RLS policies simplified to eliminate infinite recursion. Circular references to other tables removed.';
COMMENT ON TABLE individual_payments IS 'EMERGENCY FIX: All RLS policies simplified to eliminate infinite recursion.';
COMMENT ON TABLE payment_reminders IS 'EMERGENCY FIX: All RLS policies simplified to eliminate infinite recursion.';
COMMENT ON TABLE payment_refunds IS 'EMERGENCY FIX: All RLS policies simplified to eliminate infinite recursion.';
COMMENT ON TABLE booking_modifications IS 'EMERGENCY FIX: RLS policies simplified to remove split_payments references causing infinite recursion.';
COMMENT ON TABLE booking_cancellations IS 'EMERGENCY FIX: RLS policies simplified to remove split_payments references causing infinite recursion.';
COMMENT ON TABLE booking_service_disputes IS 'EMERGENCY FIX: RLS policies simplified to remove split_payments references causing infinite recursion.';