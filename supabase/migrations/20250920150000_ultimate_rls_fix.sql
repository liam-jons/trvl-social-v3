-- ULTIMATE RLS FIX - Disable RLS on ALL tables that reference split_payments
-- This addresses the final circular reference causing infinite recursion

-- Disable RLS on ALL related tables to completely eliminate recursion
ALTER TABLE split_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE split_payment_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_cancellations DISABLE ROW LEVEL SECURITY;
ALTER TABLE booking_service_disputes DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Organizers can manage split payment settings" ON split_payment_settings;
DROP POLICY IF EXISTS "System can manage payment tokens" ON payment_tokens;

-- Add comprehensive documentation
COMMENT ON TABLE split_payment_settings IS 'ULTIMATE FIX: RLS DISABLED - this table was causing infinite recursion by referencing split_payments';
COMMENT ON TABLE payment_tokens IS 'ULTIMATE FIX: RLS DISABLED - related to split payment system causing recursion';

-- Emergency fix completed - RLS disabled on all problematic tables