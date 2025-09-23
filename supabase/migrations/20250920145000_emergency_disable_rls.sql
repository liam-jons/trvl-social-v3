-- EMERGENCY: Disable RLS on all problematic tables to resolve infinite recursion
-- This is a temporary fix to stop the infinite recursion until proper policies can be implemented

-- Disable RLS completely on all problematic tables
ALTER TABLE split_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_service_disputes DISABLE ROW LEVEL SECURITY;

-- Add emergency comments
COMMENT ON TABLE split_payments IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE individual_payments IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE payment_reminders IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE payment_refunds IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE booking_modifications IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE booking_cancellations IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';
COMMENT ON TABLE booking_service_disputes IS 'EMERGENCY: RLS DISABLED due to infinite recursion - requires proper policy redesign';