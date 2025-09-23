-- Comprehensive Fix for All Split Payment RLS Recursion Issues
-- This migration fixes ALL tables in the split payment system that have circular RLS references

-- Disable RLS on all related tables
ALTER TABLE split_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing RLS policies on all split payment related tables
DROP POLICY IF EXISTS "Users can view split payments they organize or participate in" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can create split payments" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can update their split payments" ON split_payments;
DROP POLICY IF EXISTS "split_payments_organizer_all" ON split_payments;

DROP POLICY IF EXISTS "Users can view their own payments or payments they organize" ON individual_payments;
DROP POLICY IF EXISTS "System can insert individual payments" ON individual_payments;
DROP POLICY IF EXISTS "Users can update their own payment status" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_read" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_insert" ON individual_payments;
DROP POLICY IF EXISTS "individual_payments_own_update" ON individual_payments;

DROP POLICY IF EXISTS "Users can view reminders for their payments" ON payment_reminders;

DROP POLICY IF EXISTS "Users can view refunds for their payments" ON payment_refunds;

-- Re-enable RLS
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Split payments: Only organizers can access
CREATE POLICY "split_payments_organizer_access"
  ON split_payments FOR ALL
  USING (organizer_id = auth.uid());

-- Individual payments: Users can only access their own payments
CREATE POLICY "individual_payments_own_access"
  ON individual_payments FOR ALL
  USING (user_id = auth.uid());

-- Payment reminders: Users can only access their own reminders
-- We'll use a simpler approach - let users access reminders based on direct ownership
CREATE POLICY "payment_reminders_own_access"
  ON payment_reminders FOR SELECT
  USING (
    individual_payment_id IN (
      SELECT id FROM individual_payments WHERE user_id = auth.uid()
    )
  );

-- Payment refunds: Users can only access their own refunds
CREATE POLICY "payment_refunds_own_access"
  ON payment_refunds FOR SELECT
  USING (
    individual_payment_id IN (
      SELECT id FROM individual_payments WHERE user_id = auth.uid()
    )
  );

-- Add comments documenting the fix
COMMENT ON TABLE split_payments IS 'RLS policies completely redesigned to eliminate all circular references and infinite recursion - comprehensive fix applied';
COMMENT ON TABLE individual_payments IS 'RLS policies simplified to prevent recursion - comprehensive fix applied';
COMMENT ON TABLE payment_reminders IS 'RLS policies simplified to prevent recursion - comprehensive fix applied';
COMMENT ON TABLE payment_refunds IS 'RLS policies simplified to prevent recursion - comprehensive fix applied';