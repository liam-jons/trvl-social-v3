-- Create invoices table for multi-currency invoice management
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vendor_account_id VARCHAR(255), -- Stripe Connect account ID

    -- Invoice status and workflow
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),

    -- Currency and amounts (stored in smallest unit, e.g., cents)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    subtotal BIGINT NOT NULL, -- Amount before tax
    tax_rate DECIMAL(5,4) DEFAULT 0, -- Tax rate as decimal (e.g., 0.0825 for 8.25%)
    tax_amount BIGINT DEFAULT 0, -- Tax amount in cents
    total BIGINT NOT NULL, -- Total amount including tax

    -- Invoice configuration
    template VARCHAR(50) DEFAULT 'standard',

    -- Customer and vendor information (JSON)
    customer_info JSONB DEFAULT '{}',
    vendor_info JSONB DEFAULT '{}',

    -- Line items (JSON array)
    line_items JSONB DEFAULT '[]',

    -- Payment tracking
    stripe_payment_intent_id VARCHAR(255),
    paid_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,

    -- Due date and notes
    due_date DATE,
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_currency ON invoices(currency);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment_intent ON invoices(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoices
-- Users can view their own invoices
CREATE POLICY "Users can view own invoices" ON invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Vendors can view invoices for their bookings
CREATE POLICY "Vendors can view their invoices" ON invoices
    FOR SELECT USING (auth.uid() = vendor_id);

-- Users can create invoices for their bookings (as customers)
CREATE POLICY "Users can create invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vendors can create invoices for their bookings
CREATE POLICY "Vendors can create invoices" ON invoices
    FOR INSERT WITH CHECK (auth.uid() = vendor_id);

-- Users can update their own invoices (limited fields)
CREATE POLICY "Users can update own invoices" ON invoices
    FOR UPDATE USING (auth.uid() = user_id);

-- Vendors can update their invoices
CREATE POLICY "Vendors can update their invoices" ON invoices
    FOR UPDATE USING (auth.uid() = vendor_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create invoice_line_items table for detailed line items (optional, for complex invoices)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price BIGINT NOT NULL, -- Price per unit in smallest currency unit
    total_price BIGINT NOT NULL, -- Total for this line item
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- Additional data like SKU, category, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for line items
CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

-- Enable RLS for line items
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for invoice line items (inherit from parent invoice)
CREATE POLICY "Users can view own invoice line items" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_line_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Vendors can view their invoice line items" ON invoice_line_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_line_items.invoice_id
            AND invoices.vendor_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own invoice line items" ON invoice_line_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM invoices
            WHERE invoices.id = invoice_line_items.invoice_id
            AND (invoices.user_id = auth.uid() OR invoices.vendor_id = auth.uid())
        )
    );

-- Create currency_exchange_rates table for historical rate tracking
CREATE TABLE IF NOT EXISTS currency_exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    source VARCHAR(50) DEFAULT 'exchangerate-api',
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(base_currency, target_currency, valid_from)
);

-- Indexes for exchange rates
CREATE INDEX IF NOT EXISTS idx_currency_rates_base_target ON currency_exchange_rates(base_currency, target_currency);
CREATE INDEX IF NOT EXISTS idx_currency_rates_valid_from ON currency_exchange_rates(valid_from);

-- Enable RLS for exchange rates (read-only for authenticated users)
ALTER TABLE currency_exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exchange rates" ON currency_exchange_rates
    FOR SELECT USING (auth.role() = 'authenticated');

-- Function to get latest exchange rate
CREATE OR REPLACE FUNCTION get_latest_exchange_rate(base_curr VARCHAR(3), target_curr VARCHAR(3))
RETURNS DECIMAL(15,8) AS $$
DECLARE
    latest_rate DECIMAL(15,8);
BEGIN
    SELECT rate INTO latest_rate
    FROM currency_exchange_rates
    WHERE base_currency = base_curr
    AND target_currency = target_curr
    ORDER BY valid_from DESC
    LIMIT 1;

    RETURN COALESCE(latest_rate, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON invoices TO authenticated;
GRANT ALL ON invoice_line_items TO authenticated;
GRANT SELECT ON currency_exchange_rates TO authenticated;

-- Create view for invoice statistics
CREATE OR REPLACE VIEW invoice_stats AS
SELECT
    user_id,
    vendor_id,
    currency,
    COUNT(*) as total_invoices,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_count,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
    SUM(total) as total_amount,
    SUM(total) FILTER (WHERE status = 'paid') as paid_amount,
    SUM(total) FILTER (WHERE status = 'sent') as pending_amount,
    MIN(created_at) as first_invoice_date,
    MAX(created_at) as latest_invoice_date
FROM invoices
GROUP BY user_id, vendor_id, currency;

-- Grant access to the view
GRANT SELECT ON invoice_stats TO authenticated;

-- Create function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    counter INTEGER;
    year_month TEXT;
    invoice_num TEXT;
BEGIN
    -- Get current year and month
    year_month := to_char(NOW(), 'YYYYMM');

    -- Get the next sequential number for this month
    SELECT COALESCE(MAX(
        CASE
            WHEN invoice_number ~ ('^TRVL-' || year_month || '-[0-9]+$')
            THEN CAST(substring(invoice_number from '[0-9]+$') AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO counter
    FROM invoices
    WHERE invoice_number LIKE 'TRVL-' || year_month || '-%';

    -- Format the invoice number
    invoice_num := 'TRVL-' || year_month || '-' || LPAD(counter::TEXT, 4, '0');

    RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-generate invoice numbers if not provided
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number_trigger
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION set_invoice_number();