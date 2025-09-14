-- Migration: Build Vendor and Adventure Tables
-- Description: Implement vendor profiles and adventure listings with all required fields and relationships

-- Create vendor status enum
CREATE TYPE vendor_status AS ENUM ('pending', 'active', 'suspended', 'inactive');

-- Create vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  business_email TEXT,
  business_phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state_province TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status vendor_status DEFAULT 'pending' NOT NULL,
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_date TIMESTAMPTZ,
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT false,
  commission_rate DECIMAL(5, 2) DEFAULT 15.00,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create adventure categories enum
CREATE TYPE adventure_category AS ENUM (
  'hiking', 'water_sports', 'cultural', 'wildlife',
  'extreme_sports', 'food_wine', 'wellness', 'photography',
  'cycling', 'winter_sports', 'camping', 'other'
);

-- Create difficulty level enum
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'challenging', 'extreme');

-- Create adventures table
CREATE TABLE adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category adventure_category NOT NULL,
  difficulty difficulty_level,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  duration_hours DECIMAL(5, 2),
  min_capacity INTEGER DEFAULT 1,
  max_capacity INTEGER NOT NULL,
  location_name TEXT,
  meeting_point TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  what_to_bring TEXT[],
  included TEXT[],
  not_included TEXT[],
  restrictions TEXT[],
  min_age INTEGER,
  max_age INTEGER,
  fitness_level TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create adventure availability table
CREATE TABLE adventure_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available_spots INTEGER NOT NULL,
  booked_spots INTEGER DEFAULT 0,
  price_override DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(adventure_id, date, start_time)
);

-- Create adventure media table
CREATE TABLE adventure_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create vendor certifications table
CREATE TABLE vendor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiry_date DATE,
  certificate_number TEXT,
  certificate_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create vendor insurance table
CREATE TABLE vendor_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  insurance_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  policy_number TEXT,
  coverage_amount DECIMAL(12, 2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX idx_vendors_user_id ON vendors(user_id);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_location ON vendors(latitude, longitude);
CREATE INDEX idx_vendors_rating ON vendors(rating DESC);

CREATE INDEX idx_adventures_vendor_id ON adventures(vendor_id);
CREATE INDEX idx_adventures_category ON adventures(category);
CREATE INDEX idx_adventures_price ON adventures(price);
CREATE INDEX idx_adventures_location ON adventures(latitude, longitude);
CREATE INDEX idx_adventures_rating ON adventures(rating DESC);
CREATE INDEX idx_adventures_active ON adventures(is_active);

CREATE INDEX idx_adventure_availability_adventure_id ON adventure_availability(adventure_id);
CREATE INDEX idx_adventure_availability_date ON adventure_availability(date);
CREATE INDEX idx_adventure_availability_available ON adventure_availability(is_available);

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adventures_updated_at
  BEFORE UPDATE ON adventures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adventure_availability_updated_at
  BEFORE UPDATE ON adventure_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_insurance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY "Vendors are viewable by everyone"
  ON vendors FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can update own vendor profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vendor profile"
  ON vendors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for adventures
CREATE POLICY "Active adventures are viewable by everyone"
  ON adventures FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = adventures.vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Vendors can manage own adventures"
  ON adventures FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = adventures.vendor_id AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for adventure_availability
CREATE POLICY "Availability is viewable by everyone"
  ON adventure_availability FOR SELECT
  USING (true);

CREATE POLICY "Vendors can manage own adventure availability"
  ON adventure_availability FOR ALL
  USING (EXISTS (
    SELECT 1 FROM adventures
    JOIN vendors ON vendors.id = adventures.vendor_id
    WHERE adventures.id = adventure_availability.adventure_id
    AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for adventure_media
CREATE POLICY "Media is viewable by everyone"
  ON adventure_media FOR SELECT
  USING (true);

CREATE POLICY "Vendors can manage own adventure media"
  ON adventure_media FOR ALL
  USING (EXISTS (
    SELECT 1 FROM adventures
    JOIN vendors ON vendors.id = adventures.vendor_id
    WHERE adventures.id = adventure_media.adventure_id
    AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for vendor_certifications
CREATE POLICY "Certifications are viewable by everyone"
  ON vendor_certifications FOR SELECT
  USING (true);

CREATE POLICY "Vendors can manage own certifications"
  ON vendor_certifications FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_certifications.vendor_id AND vendors.user_id = auth.uid()
  ));

-- RLS Policies for vendor_insurance
CREATE POLICY "Insurance viewable by vendor and admins"
  ON vendor_insurance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_insurance.vendor_id AND vendors.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Vendors can manage own insurance"
  ON vendor_insurance FOR ALL
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_insurance.vendor_id AND vendors.user_id = auth.uid()
  ));