-- Migration: Create payment reconciliation tables
-- Description: Tables for payment reconciliation, discrepancy tracking, and audit trails
-- FIXED: Verified all table and column references are correct

-- Create payment_reconciliations table
CREATE TABLE IF NOT EXISTS payment_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    vendor_account_id UUID REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,
    total_transactions INTEGER NOT NULL DEFAULT 0,
    matched_transactions INTEGER NOT NULL DEFAULT 0,
    unmatched_transactions INTEGER NOT NULL DEFAULT 0,
    discrepancy_count INTEGER NOT NULL DEFAULT 0,
    reconciliation_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    health_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    amount_variance BIGINT NOT NULL DEFAULT 0, -- in cents
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_discrepancies table
CREATE TABLE IF NOT EXISTS payment_discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reconciliation_id UUID REFERENCES payment_reconciliations(id) ON DELETE CASCADE,
    transaction_id UUID, -- Could reference booking_payments.id
    discrepancy_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    auto_resolvable BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    resolution_action VARCHAR(100),
    resolution_notes TEXT,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment_audit_trail table
CREATE TABLE IF NOT EXISTS payment_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES booking_payments(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    previous_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    performed_by VARCHAR(100) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: payment_refunds table already exists from split payment migration
-- The existing table has individual_payment_id instead of payment_id

-- Create payout_holds table
CREATE TABLE IF NOT EXISTS payout_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_stripe_account_id UUID REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    hold_amount BIGINT, -- in cents, null for all payouts
    expires_at TIMESTAMPTZ,
    created_by VARCHAR(100) NOT NULL,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reconciliation_schedules table
CREATE TABLE IF NOT EXISTS reconciliation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_account_id UUID REFERENCES vendor_stripe_accounts(id) ON DELETE CASCADE,
    schedule_type VARCHAR(50) NOT NULL DEFAULT 'daily', -- daily, weekly, monthly
    schedule_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_vendor_account
    ON payment_reconciliations(vendor_account_id);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_date_range
    ON payment_reconciliations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_payment_reconciliations_status
    ON payment_reconciliations(status);

CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_reconciliation
    ON payment_discrepancies(reconciliation_id);
CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_transaction
    ON payment_discrepancies(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_type_severity
    ON payment_discrepancies(discrepancy_type, severity);
CREATE INDEX IF NOT EXISTS idx_payment_discrepancies_status
    ON payment_discrepancies(status);

CREATE INDEX IF NOT EXISTS idx_payment_audit_trail_payment
    ON payment_audit_trail(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_trail_action
    ON payment_audit_trail(action);
CREATE INDEX IF NOT EXISTS idx_payment_audit_trail_created_at
    ON payment_audit_trail(created_at);

-- Note: payment_refunds indexes already exist from split payment migration
-- That table uses individual_payment_id instead of payment_id
-- Indexes already created: idx_payment_refunds_payment, idx_payment_refunds_split, idx_payment_refunds_stripe
-- No additional indexes needed for payment_refunds table

CREATE INDEX IF NOT EXISTS idx_payout_holds_vendor_account
    ON payout_holds(vendor_stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_payout_holds_status
    ON payout_holds(status);

CREATE INDEX IF NOT EXISTS idx_reconciliation_schedules_vendor_account
    ON reconciliation_schedules(vendor_account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_schedules_next_run
    ON reconciliation_schedules(next_run);

-- Note: update_updated_at_column() function already exists from earlier migrations
-- No need to recreate it

DROP TRIGGER IF EXISTS update_payment_reconciliations_updated_at ON payment_reconciliations;
CREATE TRIGGER update_payment_reconciliations_updated_at
    BEFORE UPDATE ON payment_reconciliations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_discrepancies_updated_at ON payment_discrepancies;
CREATE TRIGGER update_payment_discrepancies_updated_at
    BEFORE UPDATE ON payment_discrepancies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_refunds_updated_at ON payment_refunds;
CREATE TRIGGER update_payment_refunds_updated_at
    BEFORE UPDATE ON payment_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payout_holds_updated_at ON payout_holds;
CREATE TRIGGER update_payout_holds_updated_at
    BEFORE UPDATE ON payout_holds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reconciliation_schedules_updated_at ON reconciliation_schedules;
CREATE TRIGGER update_reconciliation_schedules_updated_at
    BEFORE UPDATE ON reconciliation_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE payment_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor access control
-- payment_reconciliations
DROP POLICY IF EXISTS "Vendors can view their own reconciliations" ON payment_reconciliations;
CREATE POLICY "Vendors can view their own reconciliations" ON payment_reconciliations
    FOR SELECT USING (
        vendor_account_id IN (
            SELECT id FROM vendor_stripe_accounts
            WHERE user_id = auth.uid()
        )
        OR auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Service can manage reconciliations" ON payment_reconciliations;
CREATE POLICY "Service can manage reconciliations" ON payment_reconciliations
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- payment_discrepancies
DROP POLICY IF EXISTS "Vendors can view their own discrepancies" ON payment_discrepancies;
CREATE POLICY "Vendors can view their own discrepancies" ON payment_discrepancies
    FOR SELECT USING (
        reconciliation_id IN (
            SELECT pr.id FROM payment_reconciliations pr
            JOIN vendor_stripe_accounts vsa ON pr.vendor_account_id = vsa.id
            WHERE vsa.user_id = auth.uid()
        )
        OR auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Service can manage discrepancies" ON payment_discrepancies;
CREATE POLICY "Service can manage discrepancies" ON payment_discrepancies
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- payment_audit_trail
DROP POLICY IF EXISTS "Vendors can view their payment audit trail" ON payment_audit_trail;
CREATE POLICY "Vendors can view their payment audit trail" ON payment_audit_trail
    FOR SELECT USING (
        payment_id IN (
            SELECT bp.id FROM booking_payments bp
            JOIN vendor_stripe_accounts vsa ON bp.vendor_stripe_account_id = vsa.id
            WHERE vsa.user_id = auth.uid()
        )
        OR auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Service can manage audit trail" ON payment_audit_trail;
CREATE POLICY "Service can manage audit trail" ON payment_audit_trail
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- payment_refunds
-- Note: The existing payment_refunds table uses individual_payment_id, not payment_id
-- RLS policies already exist from split payment migration
-- Adding additional policies for reconciliation access if needed
DROP POLICY IF EXISTS "Service can manage refunds for reconciliation" ON payment_refunds;
CREATE POLICY "Service can manage refunds for reconciliation" ON payment_refunds
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- payout_holds
DROP POLICY IF EXISTS "Vendors can view their holds" ON payout_holds;
CREATE POLICY "Vendors can view their holds" ON payout_holds
    FOR SELECT USING (
        vendor_stripe_account_id IN (
            SELECT id FROM vendor_stripe_accounts
            WHERE user_id = auth.uid()
        )
        OR auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Admin can manage holds" ON payout_holds;
CREATE POLICY "Admin can manage holds" ON payout_holds
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- reconciliation_schedules
DROP POLICY IF EXISTS "Vendors can manage their schedules" ON reconciliation_schedules;
CREATE POLICY "Vendors can manage their schedules" ON reconciliation_schedules
    FOR ALL USING (
        vendor_account_id IN (
            SELECT id FROM vendor_stripe_accounts
            WHERE user_id = auth.uid()
        )
        OR auth.uid() IN (
            SELECT id FROM profiles
            WHERE role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON TABLE payment_reconciliations IS 'Records of payment reconciliation runs with summary statistics';
COMMENT ON TABLE payment_discrepancies IS 'Individual discrepancies found during reconciliation';
COMMENT ON TABLE payment_audit_trail IS 'Audit trail for all payment modifications and actions';
-- Note: payment_refunds table comment already exists from split payment migration
COMMENT ON TABLE payout_holds IS 'Administrative holds on vendor payouts';
COMMENT ON TABLE reconciliation_schedules IS 'Automated reconciliation scheduling configuration';

COMMENT ON COLUMN payment_reconciliations.health_score IS 'Overall health score (0-100) based on reconciliation rate and discrepancies';
COMMENT ON COLUMN payment_reconciliations.amount_variance IS 'Difference between database and Stripe amounts in cents';
COMMENT ON COLUMN payment_discrepancies.auto_resolvable IS 'Whether this discrepancy can be automatically resolved';
COMMENT ON COLUMN payment_audit_trail.previous_values IS 'JSON snapshot of values before change';
COMMENT ON COLUMN payment_audit_trail.new_values IS 'JSON snapshot of values after change';