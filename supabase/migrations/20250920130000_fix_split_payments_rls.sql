-- Fix Split Payments RLS Infinite Recursion
-- The split_payments and individual_payments tables have circular RLS references causing infinite recursion

-- Disable RLS temporarily
ALTER TABLE split_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies on split_payments
DROP POLICY IF EXISTS "Users can view split payments they organize or participate in" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can create split payments" ON split_payments;
DROP POLICY IF EXISTS "Only organizers can update their split payments" ON split_payments;

-- Drop all existing RLS policies on individual_payments
DROP POLICY IF EXISTS "Users can view their own payments or payments they organize" ON individual_payments;
DROP POLICY IF EXISTS "System can insert individual payments" ON individual_payments;

-- Re-enable RLS
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_payments ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for split_payments
CREATE POLICY "split_payments_organizer_all"
  ON split_payments FOR ALL
  USING (organizer_id = auth.uid());

-- Create simple, non-recursive policies for individual_payments
CREATE POLICY "individual_payments_own_read"
  ON individual_payments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "individual_payments_own_insert"
  ON individual_payments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "individual_payments_own_update"
  ON individual_payments FOR UPDATE
  USING (user_id = auth.uid());

-- Add comments
COMMENT ON TABLE split_payments IS 'RLS policies simplified to prevent infinite recursion with individual_payments - emergency fix applied';
COMMENT ON TABLE individual_payments IS 'RLS policies simplified to prevent infinite recursion with split_payments - emergency fix applied';