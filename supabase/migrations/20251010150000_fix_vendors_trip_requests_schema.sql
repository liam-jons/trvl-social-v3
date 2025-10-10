-- Migration: Fix vendors and trip_requests schema for offer management
-- Description: Add missing columns to vendors and trip_requests tables

-- Add missing columns to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Add missing columns to trip_requests table
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS title TEXT;

-- Set default title from description for existing records
UPDATE trip_requests
SET title = COALESCE(
  CASE
    WHEN LENGTH(description) > 50
    THEN LEFT(description, 47) || '...'
    ELSE description
  END,
  destination || ' Trip'
)
WHERE title IS NULL;

-- Make title NOT NULL after populating existing records
ALTER TABLE trip_requests
ALTER COLUMN title SET NOT NULL;

-- Add comment to clarify column usage
COMMENT ON COLUMN vendors.avatar_url IS 'Vendor business logo or profile picture URL';
COMMENT ON COLUMN vendors.specialties IS 'Array of vendor specialties/services offered';
COMMENT ON COLUMN vendors.certifications IS 'Array of certification names (detailed records in vendor_certifications table)';
COMMENT ON COLUMN trip_requests.title IS 'Short trip request title for display';
