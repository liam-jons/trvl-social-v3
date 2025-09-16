-- Create booking modification and audit tables
-- This migration supports the comprehensive modification and cancellation workflows

-- Note: Using gen_random_uuid() which is built-in, no extension needed

-- Booking modifications table (already exists, adding missing columns)
-- Original table has: id, booking_id, modified_by, modification_type, old_value, new_value, reason, created_at
-- Adding enhanced workflow columns to existing table
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS requested_changes JSONB DEFAULT '{}';
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'normal';
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_vendor_review';
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS estimated_fees INTEGER DEFAULT 0;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS fee_breakdown JSONB DEFAULT '[]';
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS auto_approval_eligible BOOLEAN DEFAULT false;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS auto_approval_reason TEXT;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS vendor_response_deadline TIMESTAMPTZ;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE booking_modifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for booking_modifications
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_modified_by ON booking_modifications(modified_by);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_status ON booking_modifications(status);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_type ON booking_modifications(modification_type);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_deadline ON booking_modifications(vendor_response_deadline);

-- Booking cancellations table
CREATE TABLE IF NOT EXISTS booking_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cancellation_type TEXT NOT NULL DEFAULT 'full',
    reason TEXT NOT NULL,
    special_circumstances TEXT,
    evidence_provided JSONB DEFAULT '{}',
    participants_cancelled JSONB DEFAULT '[]',
    refund_eligible BOOLEAN DEFAULT false,
    refund_percentage INTEGER DEFAULT 0,
    refund_amount INTEGER DEFAULT 0,
    policy_applied JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending_review',
    processed_by UUID REFERENCES profiles(id),
    processed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for booking_cancellations
CREATE INDEX idx_booking_cancellations_booking_id ON booking_cancellations(booking_id);
CREATE INDEX idx_booking_cancellations_user_id ON booking_cancellations(user_id);
CREATE INDEX idx_booking_cancellations_status ON booking_cancellations(status);
CREATE INDEX idx_booking_cancellations_type ON booking_cancellations(cancellation_type);

-- Booking audit logs table
CREATE TABLE IF NOT EXISTS booking_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    modification_request_id UUID REFERENCES booking_modifications(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    actor_id TEXT NOT NULL, -- Can be user ID or 'system'
    actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'vendor', 'admin', 'system'
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for booking_audit_logs
CREATE INDEX idx_booking_audit_logs_booking_id ON booking_audit_logs(booking_id);
CREATE INDEX idx_booking_audit_logs_action ON booking_audit_logs(action);
CREATE INDEX idx_booking_audit_logs_actor ON booking_audit_logs(actor_id, actor_type);
CREATE INDEX idx_booking_audit_logs_created_at ON booking_audit_logs(created_at);

-- Booking disputes table (already exists with different structure for Stripe disputes)
-- Creating separate table for customer service disputes
CREATE TABLE IF NOT EXISTS booking_service_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    related_modification_id UUID REFERENCES booking_modifications(id) ON DELETE SET NULL,
    dispute_type TEXT NOT NULL,
    category TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    requested_resolution TEXT NOT NULL,
    evidence_files JSONB DEFAULT '[]',
    urgency TEXT NOT NULL DEFAULT 'normal',
    contact_preference TEXT NOT NULL DEFAULT 'email',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES profiles(id),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for booking_service_disputes
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_booking_id ON booking_service_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_user_id ON booking_service_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_status ON booking_service_disputes(status);
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_type ON booking_service_disputes(dispute_type);
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_urgency ON booking_service_disputes(urgency);
CREATE INDEX IF NOT EXISTS idx_booking_service_disputes_assigned_to ON booking_service_disputes(assigned_to);

-- Dispute threads table for tracking communications
CREATE TABLE IF NOT EXISTS dispute_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES booking_service_disputes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL DEFAULT 'message',
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_internal BOOLEAN DEFAULT false,
    read_by JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for dispute_threads
CREATE INDEX idx_dispute_threads_dispute_id ON dispute_threads(dispute_id);
CREATE INDEX idx_dispute_threads_user_id ON dispute_threads(user_id);
CREATE INDEX idx_dispute_threads_created_at ON dispute_threads(created_at);

-- Refund requests table (already exists, adding missing columns)
-- Original table has: id, booking_id, split_payment_id, user_id, reason_category, reason_description, additional_details, etc.
-- Adding missing columns that might not exist in original
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMPTZ;
ALTER TABLE refund_requests ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;

-- Create indexes for refund_requests
CREATE INDEX IF NOT EXISTS idx_refund_requests_booking_id ON refund_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_user_id ON refund_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);
CREATE INDEX IF NOT EXISTS idx_refund_requests_split_payment_id ON refund_requests(split_payment_id);

-- Payment disputes table (already exists, adding missing columns if needed)
-- Original table has different structure, adding missing columns
ALTER TABLE payment_disputes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE payment_disputes ADD COLUMN IF NOT EXISTS customer_message TEXT;
ALTER TABLE payment_disputes ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- Create indexes for payment_disputes
CREATE INDEX IF NOT EXISTS idx_payment_disputes_stripe_dispute_id ON payment_disputes(stripe_dispute_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_booking_id ON payment_disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_status ON payment_disputes(status);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_evidence_due_by ON payment_disputes(evidence_due_by);

-- Update vendors table to include modification settings
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS modification_settings JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{}';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS refund_policy JSONB DEFAULT '{}';

-- Update adventures table to include policies
ALTER TABLE adventures ADD COLUMN IF NOT EXISTS modification_policy JSONB DEFAULT '{}';
ALTER TABLE adventures ADD COLUMN IF NOT EXISTS cancellation_policy JSONB DEFAULT '{}';

-- Update bookings table for additional fields
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS custom_itinerary JSONB DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS accommodation_preferences JSONB DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_preferences JSONB DEFAULT '{}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS participant_details JSONB DEFAULT '{}';

-- Create RLS policies for booking_modifications
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own modification requests
CREATE POLICY "Users can view their own modifications" ON booking_modifications
    FOR SELECT USING (modified_by = auth.uid());

-- Users can create modification requests for their bookings
CREATE POLICY "Users can create modifications" ON booking_modifications
    FOR INSERT WITH CHECK (
        modified_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = booking_id AND (user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM split_payments WHERE booking_id = bookings.id AND organizer_id = auth.uid()))
        )
    );

-- Users can update their own pending modifications
CREATE POLICY "Users can update their modifications" ON booking_modifications
    FOR UPDATE USING (
        modified_by = auth.uid() AND status IN ('pending_vendor_review', 'auto_approved')
    );

-- Vendors can see and update modifications for their adventures
CREATE POLICY "Vendors can manage modifications" ON booking_modifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = booking_id AND v.user_id = auth.uid()
        )
    );

-- Admins can see all modifications
CREATE POLICY "Admins can view all modifications" ON booking_modifications
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for booking_cancellations
ALTER TABLE booking_cancellations ENABLE ROW LEVEL SECURITY;

-- Users can see their own cancellations
CREATE POLICY "Users can view their own cancellations" ON booking_cancellations
    FOR SELECT USING (user_id = auth.uid());

-- Users can create cancellations for their bookings
CREATE POLICY "Users can create cancellations" ON booking_cancellations
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = booking_id AND (user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM split_payments WHERE booking_id = bookings.id AND organizer_id = auth.uid()))
        )
    );

-- Vendors can see cancellations for their adventures
CREATE POLICY "Vendors can view cancellations" ON booking_cancellations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = booking_id AND v.user_id = auth.uid()
        )
    );

-- Admins can manage all cancellations
CREATE POLICY "Admins can manage cancellations" ON booking_cancellations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for booking_audit_logs
ALTER TABLE booking_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can see audit logs for their bookings
CREATE POLICY "Users can view booking audit logs" ON booking_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = booking_id AND (user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM split_payments WHERE booking_id = bookings.id AND organizer_id = auth.uid()))
        )
    );

-- Vendors can see audit logs for their adventures
CREATE POLICY "Vendors can view audit logs" ON booking_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = booking_id AND v.user_id = auth.uid()
        )
    );

-- System can insert audit logs
CREATE POLICY "System can create audit logs" ON booking_audit_logs
    FOR INSERT WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON booking_audit_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for booking_service_disputes
ALTER TABLE booking_service_disputes ENABLE ROW LEVEL SECURITY;

-- Users can see their own disputes
CREATE POLICY "Users can view their own disputes" ON booking_service_disputes
    FOR SELECT USING (user_id = auth.uid());

-- Users can create disputes for their bookings
CREATE POLICY "Users can create disputes" ON booking_service_disputes
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM bookings
            WHERE id = booking_id AND (user_id = auth.uid() OR
                EXISTS (SELECT 1 FROM split_payments WHERE booking_id = bookings.id AND organizer_id = auth.uid()))
        )
    );

-- Users can update their own disputes
CREATE POLICY "Users can update their disputes" ON booking_service_disputes
    FOR UPDATE USING (user_id = auth.uid());

-- Vendors can see disputes for their adventures
CREATE POLICY "Vendors can view disputes" ON booking_service_disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN adventures a ON b.adventure_id = a.id
            JOIN vendors v ON a.vendor_id = v.id
            WHERE b.id = booking_id AND v.user_id = auth.uid()
        )
    );

-- Admins can manage all disputes
CREATE POLICY "Admins can manage disputes" ON booking_service_disputes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create RLS policies for dispute_threads
ALTER TABLE dispute_threads ENABLE ROW LEVEL SECURITY;

-- Users can see threads for their disputes
CREATE POLICY "Users can view dispute threads" ON dispute_threads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM booking_service_disputes
            WHERE id = dispute_id AND (user_id = auth.uid() OR assigned_to = auth.uid())
        )
    );

-- Users can create messages in their disputes
CREATE POLICY "Users can create dispute messages" ON dispute_threads
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM booking_service_disputes
            WHERE id = dispute_id AND (user_id = auth.uid() OR assigned_to = auth.uid())
        )
    );

-- Admins can view and create all dispute threads
CREATE POLICY "Admins can manage dispute threads" ON dispute_threads
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers with DROP IF EXISTS first to avoid conflicts
DROP TRIGGER IF EXISTS update_booking_modifications_updated_at ON booking_modifications;
CREATE TRIGGER update_booking_modifications_updated_at
    BEFORE UPDATE ON booking_modifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_cancellations_updated_at ON booking_cancellations;
CREATE TRIGGER update_booking_cancellations_updated_at
    BEFORE UPDATE ON booking_cancellations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_service_disputes_updated_at ON booking_service_disputes;
CREATE TRIGGER update_booking_service_disputes_updated_at
    BEFORE UPDATE ON booking_service_disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_refund_requests_updated_at ON refund_requests;
CREATE TRIGGER update_refund_requests_updated_at
    BEFORE UPDATE ON refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_disputes_updated_at ON payment_disputes;
CREATE TRIGGER update_payment_disputes_updated_at
    BEFORE UPDATE ON payment_disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create notification triggers for important events
CREATE OR REPLACE FUNCTION notify_modification_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify when modification status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO notifications (user_id, type, title, message, data, created_at)
        VALUES (
            NEW.modified_by,
            'modification_status_change',
            'Modification Status Updated',
            'Your booking modification request status has been updated to: ' || NEW.status,
            jsonb_build_object(
                'booking_id', NEW.booking_id,
                'modification_id', NEW.id,
                'old_status', OLD.status,
                'new_status', NEW.status
            ),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS modification_status_change_notification ON booking_modifications;
CREATE TRIGGER modification_status_change_notification
    AFTER UPDATE ON booking_modifications
    FOR EACH ROW EXECUTE FUNCTION notify_modification_status_change();

-- Insert sample modification types for reference
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('modification_types', '{
    "date_change": {
        "label": "Date Change",
        "description": "Modify trip start and/or end dates",
        "auto_approval_eligible": true
    },
    "participant_update": {
        "label": "Participant Update",
        "description": "Add or remove participants",
        "auto_approval_eligible": true
    },
    "itinerary_adjustment": {
        "label": "Itinerary Adjustment",
        "description": "Modify activities or schedule",
        "auto_approval_eligible": false
    },
    "accommodation_change": {
        "label": "Accommodation Change",
        "description": "Update hotel or lodging preferences",
        "auto_approval_eligible": false
    },
    "meal_preference": {
        "label": "Meal Preferences",
        "description": "Update dietary requirements",
        "auto_approval_eligible": true
    },
    "special_requests": {
        "label": "Special Requests",
        "description": "Add special accommodations",
        "auto_approval_eligible": true
    }
}', 'Available booking modification types and their settings')
ON CONFLICT (setting_key) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE booking_modifications IS 'Tracks all booking modification requests and their approval status';
COMMENT ON TABLE booking_cancellations IS 'Records booking cancellation requests and refund eligibility';
COMMENT ON TABLE booking_audit_logs IS 'Comprehensive audit trail for all booking-related changes';
COMMENT ON TABLE booking_service_disputes IS 'Customer service disputes related to bookings, modifications, or cancellations';
COMMENT ON TABLE dispute_threads IS 'Communication threads for dispute resolution';
COMMENT ON TABLE refund_requests IS 'Customer-initiated refund requests with approval workflow';
COMMENT ON TABLE payment_disputes IS 'Payment disputes from Stripe or other payment processors';

-- Create storage bucket for dispute evidence if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-documents', 'dispute-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for dispute documents
CREATE POLICY "Users can upload dispute evidence" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'dispute-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their dispute evidence" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'dispute-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Admins can view all dispute evidence" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'dispute-documents' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );