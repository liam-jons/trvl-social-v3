-- Migration: Implement Booking and Payment Tables
-- Description: Create booking system tables with payment tracking and group booking support

-- Create booking status enum
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'expired');

-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('stripe', 'paypal', 'bank_transfer', 'cash', 'other');

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id),
  availability_id UUID REFERENCES adventure_availability(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  booking_code TEXT UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  status booking_status DEFAULT 'pending' NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_participants INTEGER NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  commission_amount DECIMAL(10, 2),
  vendor_payout DECIMAL(10, 2),
  is_group_booking BOOLEAN DEFAULT false,
  group_id UUID,
  special_requests TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create booking payments table
CREATE TABLE booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status payment_status DEFAULT 'pending' NOT NULL,
  payment_method payment_method,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  paypal_transaction_id TEXT,
  transaction_reference TEXT,
  paid_at TIMESTAMPTZ,
  refunded_amount DECIMAL(10, 2) DEFAULT 0,
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create booking participants table
CREATE TABLE booking_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  payment_id UUID REFERENCES booking_payments(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  dietary_restrictions TEXT,
  medical_conditions TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  has_paid BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create payment splits table for group bookings
CREATE TABLE payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount_owed DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  payment_status payment_status DEFAULT 'pending',
  payment_deadline TIMESTAMPTZ,
  last_reminder_sent TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  payment_id UUID REFERENCES booking_payments(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create booking modifications table
CREATE TABLE booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  modified_by UUID NOT NULL REFERENCES profiles(id),
  modification_type TEXT NOT NULL CHECK (modification_type IN ('date_change', 'participant_change', 'cancellation', 'refund', 'other')),
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  adventure_id UUID NOT NULL REFERENCES adventures(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_booking BOOLEAN DEFAULT true,
  vendor_response TEXT,
  vendor_response_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(booking_id, user_id)
);

-- Create indexes
CREATE INDEX idx_bookings_adventure_id ON bookings(adventure_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_vendor_id ON bookings(vendor_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_group_id ON bookings(group_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

CREATE INDEX idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX idx_booking_payments_user_id ON booking_payments(user_id);
CREATE INDEX idx_booking_payments_status ON booking_payments(status);

CREATE INDEX idx_booking_participants_booking_id ON booking_participants(booking_id);
CREATE INDEX idx_booking_participants_user_id ON booking_participants(user_id);

CREATE INDEX idx_payment_splits_booking_id ON payment_splits(booking_id);
CREATE INDEX idx_payment_splits_user_id ON payment_splits(user_id);
CREATE INDEX idx_payment_splits_status ON payment_splits(payment_status);

CREATE INDEX idx_reviews_adventure_id ON reviews(adventure_id);
CREATE INDEX idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Create triggers for updated_at
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_payments_updated_at
  BEFORE UPDATE ON booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_splits_updated_at
  BEFORE UPDATE ON payment_splits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- RLS Policies for booking_payments
CREATE POLICY "Users can view own payments"
  ON booking_payments FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM bookings
    JOIN vendors ON vendors.id = bookings.vendor_id
    WHERE bookings.id = booking_payments.booking_id
    AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Users can create payments for own bookings"
  ON booking_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for booking_participants
CREATE POLICY "Participants viewable by booking owner and vendor"
  ON booking_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_participants.booking_id
    AND (bookings.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can manage participants for own bookings"
  ON booking_participants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_participants.booking_id
    AND bookings.user_id = auth.uid()
  ));

-- RLS Policies for payment_splits
CREATE POLICY "Users can view own payment splits"
  ON payment_splits FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM bookings WHERE bookings.id = payment_splits.booking_id AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own payment splits"
  ON payment_splits FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for booking_modifications
CREATE POLICY "Modifications viewable by booking parties"
  ON booking_modifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_modifications.booking_id
    AND (bookings.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM vendors WHERE vendors.id = bookings.vendor_id AND vendors.user_id = auth.uid()
    ))
  ));

-- RLS Policies for reviews
CREATE POLICY "Reviews are publicly viewable"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = reviews.booking_id
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'completed'
  ));

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);