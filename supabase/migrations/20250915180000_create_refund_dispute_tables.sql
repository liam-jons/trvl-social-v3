-- Create refund and dispute management tables
-- Migration: 20250915_011_create_refund_dispute_tables
-- FIXED: Corrected all table and column references

-- Create refund_requests table for tracking user-initiated refund requests
CREATE TABLE IF NOT EXISTS refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    split_payment_id UUID REFERENCES split_payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

    -- Refund request details
    reason_category TEXT NOT NULL CHECK (reason_category IN (
        'booking_cancelled',
        'vendor_requested',
        'quality_issues',
        'emergency',
        'weather',
        'duplicate_payment',
        'other'
    )),
    reason_description TEXT NOT NULL,
    additional_details TEXT,

    -- Requested refund amount
    requested_amount_type TEXT NOT NULL DEFAULT 'full' CHECK (requested_amount_type IN ('full', 'partial', 'custom')),
    custom_amount INTEGER, -- in cents, only used if requested_amount_type = 'custom'

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending_review' CHECK (status IN (
        'pending_review',
        'under_review',
        'approved_processed',
        'denied',
        'processing_failed'
    )),

    -- Admin/vendor response
    vendor_notes TEXT,
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create payment_disputes table for tracking Stripe disputes and chargebacks
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Stripe dispute information
    stripe_dispute_id TEXT NOT NULL UNIQUE,
    stripe_charge_id TEXT NOT NULL,

    -- Dispute details
    amount INTEGER NOT NULL, -- in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN (
        'warning_needs_response',
        'warning_under_review',
        'warning_closed',
        'needs_response',
        'under_review',
        'charge_refunded',
        'won',
        'lost'
    )),

    -- Evidence and response
    evidence_due_by TIMESTAMPTZ,
    customer_message TEXT,
    admin_response TEXT,
    evidence_files TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Related records
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata from Stripe
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking_id ON refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_created_at ON refund_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_dispute_id ON payment_disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_evidence_due_by ON payment_disputes(evidence_due_by);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_booking_id ON payment_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_created_at ON payment_disputes(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for refund_requests

-- Users can view their own refund requests
CREATE POLICY "Users can view own refund requests" ON refund_requests
    FOR SELECT USING (user_id = auth.uid());

-- Users can create their own refund requests
CREATE POLICY "Users can create own refund requests" ON refund_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Vendors can view refund requests for their adventures
CREATE POLICY "Vendors can view refund requests for their adventures" ON refund_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = refund_requests.booking_id
            AND v.user_id = auth.uid()
        )
    );

-- Vendors can update refund requests for their adventures
CREATE POLICY "Vendors can update refund requests for their adventures" ON refund_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = refund_requests.booking_id
            AND v.user_id = auth.uid()
        )
    );

-- Admins can view all refund requests
CREATE POLICY "Admins can view all refund requests" ON refund_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for payment_disputes

-- Only admins can view payment disputes
CREATE POLICY "Admins can view all payment disputes" ON payment_disputes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Vendors can view disputes related to their bookings
CREATE POLICY "Vendors can view disputes for their bookings" ON payment_disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = payment_disputes.booking_id
            AND v.user_id = auth.uid()
        )
    );

-- Update payment_refunds table to include refund_request_id reference
ALTER TABLE payment_refunds
ADD COLUMN IF NOT EXISTS refund_request_id UUID REFERENCES refund_requests(id) ON DELETE SET NULL;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_payment_refunds_refund_request_id ON payment_refunds(refund_request_id);

-- Create storage bucket for dispute evidence files
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for dispute evidence storage
CREATE POLICY "Admins can upload dispute evidence"
    ON storage.objects FOR ALL
    USING (bucket_id = 'dispute-evidence' AND
           EXISTS (
               SELECT 1 FROM profiles
               WHERE id = auth.uid()
               AND role = 'admin'
           ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_payment_disputes_updated_at
    BEFORE UPDATE ON payment_disputes
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add vendor refund policies to vendors table if not exists
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS refund_policy JSONB DEFAULT '{
    "fullRefundHours": 48,
    "partialRefundHours": 24,
    "noRefundHours": 0,
    "emergencyRefundAllowed": true,
    "weatherRefundAllowed": true
}'::jsonb;

-- Add cancellation policy to adventures table if not exists
ALTER TABLE adventures
ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{
    "fullRefundHours": 48,
    "partialRefundHours": 24,
    "noRefundHours": 0
}'::jsonb;

-- Create view for comprehensive refund tracking
CREATE OR REPLACE VIEW refund_tracking_view AS
SELECT
    pr.id as refund_id,
    pr.stripe_refund_id,
    pr.refund_amount,
    pr.refund_reason,
    pr.status as refund_status,
    pr.processed_at,
    pr.created_at as refund_created_at,

    -- Refund request information
    rr.id as request_id,
    rr.reason_category as request_reason,
    rr.reason_description as request_description,
    rr.status as request_status,
    rr.created_at as request_created_at,

    -- Payment information
    ip.user_id,
    ip.amount_due as original_amount,
    sp.id as split_payment_id,
    sp.description as payment_description,
    sp.organizer_id,

    -- Booking information
    b.id as booking_id,
    a.title as adventure_title,
    a.vendor_id,

    -- User information
    u.id as customer_id,
    u.full_name as customer_name,

    -- Vendor information
    v.business_name as vendor_name

FROM payment_refunds pr
LEFT JOIN refund_requests rr ON pr.refund_request_id = rr.id
LEFT JOIN individual_payments ip ON pr.individual_payment_id = ip.id
LEFT JOIN split_payments sp ON pr.split_payment_id = sp.id
LEFT JOIN bookings b ON sp.booking_id = b.id
LEFT JOIN adventures a ON b.adventure_id = a.id
LEFT JOIN profiles u ON ip.user_id = u.id
LEFT JOIN vendors v ON a.vendor_id = v.id;

-- Grant appropriate permissions
GRANT SELECT ON refund_tracking_view TO authenticated;

-- Comments for documentation
COMMENT ON TABLE refund_requests IS 'User-initiated refund requests with vendor review workflow';
COMMENT ON TABLE payment_disputes IS 'Stripe payment disputes and chargebacks tracking';
COMMENT ON VIEW refund_tracking_view IS 'Comprehensive view combining refund requests, payments, and bookings';

COMMENT ON COLUMN refund_requests.reason_category IS 'Categorized reason for refund request';
COMMENT ON COLUMN refund_requests.requested_amount_type IS 'Type of refund amount requested (full, partial, custom)';
COMMENT ON COLUMN refund_requests.custom_amount IS 'Custom refund amount in cents (when type is custom)';

COMMENT ON COLUMN payment_disputes.stripe_dispute_id IS 'Unique identifier from Stripe for the dispute';
COMMENT ON COLUMN payment_disputes.evidence_due_by IS 'Deadline for submitting evidence to Stripe';
COMMENT ON COLUMN payment_disputes.evidence_files IS 'Array of file paths for uploaded evidence';