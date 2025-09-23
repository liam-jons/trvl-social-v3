-- Migration: Add Encrypted Birth Date Storage
-- Description: Add encrypted birth date column and transition from plain text storage
-- COPPA Compliance: Ensures birth dates are encrypted at rest

-- Add encrypted birth date column to profiles table
ALTER TABLE profiles
ADD COLUMN encrypted_birth_date TEXT;

-- Add indexes for performance (though we won't search on encrypted data directly)
CREATE INDEX idx_profiles_encrypted_birth_date_exists
ON profiles(encrypted_birth_date)
WHERE encrypted_birth_date IS NOT NULL;

-- Create function to handle birth date encryption during profile updates
CREATE OR REPLACE FUNCTION handle_birth_date_encryption()
RETURNS TRIGGER AS $$
BEGIN
  -- If both encrypted and plain text birth dates are provided, prefer encrypted
  -- This allows for a gradual migration
  IF NEW.encrypted_birth_date IS NOT NULL AND NEW.date_of_birth IS NOT NULL THEN
    -- Clear the plain text date when encrypted version is available
    NEW.date_of_birth = NULL;
  END IF;

  -- Allow the update to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to handle birth date encryption logic
CREATE TRIGGER handle_birth_date_encryption_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_birth_date_encryption();

-- Update age verification constraint to work with encrypted data
-- Note: We'll need to validate encrypted birth dates in application code
-- The database constraint will only apply to plain text dates (for backward compatibility)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_minimum_age;

-- Add new constraint that allows encrypted birth dates
ALTER TABLE profiles
ADD CONSTRAINT check_minimum_age_or_encrypted
CHECK (
  -- Allow if no birth date is provided
  (date_of_birth IS NULL AND encrypted_birth_date IS NULL) OR
  -- Allow if encrypted birth date is provided (validation happens in app)
  (encrypted_birth_date IS NOT NULL) OR
  -- Apply age check only to plain text dates
  (date_of_birth IS NOT NULL AND date_part('year', age(date_of_birth)) >= 13)
);

-- Update the handle_new_user function to support encrypted birth dates
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email_verified,
    full_name,
    date_of_birth,
    encrypted_birth_date
  )
  VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Only set plain text date if no encrypted version provided
    CASE
      WHEN NEW.raw_user_meta_data->>'encrypted_birth_date' IS NOT NULL THEN NULL
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    -- Set encrypted birth date if provided
    NEW.raw_user_meta_data->>'encrypted_birth_date'
  );

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the age validation function to handle encrypted dates
CREATE OR REPLACE FUNCTION validate_age_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If date_of_birth is being set or updated (plain text), validate age
  IF NEW.date_of_birth IS NOT NULL THEN
    IF date_part('year', age(NEW.date_of_birth)) < 13 THEN
      RAISE EXCEPTION 'COPPA_VIOLATION: Users must be at least 13 years old. Current age: % years',
        date_part('year', age(NEW.date_of_birth))
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- For encrypted birth dates, validation happens in application code
  -- We just ensure that the encrypted data looks valid (basic check)
  IF NEW.encrypted_birth_date IS NOT NULL THEN
    -- Basic validation: check if it's a non-empty string
    IF length(trim(NEW.encrypted_birth_date)) = 0 THEN
      RAISE EXCEPTION 'COPPA_VIOLATION: Invalid encrypted birth date format'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update age verification logging to handle encrypted dates
CREATE OR REPLACE FUNCTION log_age_verification(
  user_id UUID,
  verification_result BOOLEAN,
  date_of_birth DATE DEFAULT NULL,
  encrypted_birth_date TEXT DEFAULT NULL,
  error_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Ensure the age verification logs table exists
  CREATE TABLE IF NOT EXISTS age_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    verification_date TIMESTAMPTZ DEFAULT NOW(),
    date_of_birth DATE,
    encrypted_birth_date_provided BOOLEAN DEFAULT FALSE,
    calculated_age INTEGER,
    verification_result BOOLEAN,
    error_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  INSERT INTO age_verification_logs (
    user_id,
    date_of_birth,
    encrypted_birth_date_provided,
    calculated_age,
    verification_result,
    error_reason
  )
  VALUES (
    user_id,
    date_of_birth, -- Will be NULL for encrypted dates
    encrypted_birth_date IS NOT NULL,
    CASE
      WHEN date_of_birth IS NOT NULL THEN date_part('year', age(date_of_birth))
      ELSE NULL -- Age calculation for encrypted dates happens in application
    END,
    verification_result,
    error_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add column for tracking encryption status in age verification logs
ALTER TABLE age_verification_logs
ADD COLUMN IF NOT EXISTS encrypted_birth_date_provided BOOLEAN DEFAULT FALSE;

-- Update RLS policies to handle encrypted birth dates
-- The existing policies are sufficient as they work with the entire row

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON age_verification_logs TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN profiles.encrypted_birth_date IS
'Encrypted birth date using AES-256-GCM for COPPA compliance. Application-level encryption/decryption required.';

COMMENT ON CONSTRAINT check_minimum_age_or_encrypted ON profiles IS
'COPPA compliance: Allows encrypted birth dates or validates plain text dates for minimum age of 13';

COMMENT ON FUNCTION handle_birth_date_encryption() IS
'Handles transition from plain text to encrypted birth date storage';

COMMENT ON FUNCTION log_age_verification(UUID, BOOLEAN, DATE, TEXT, TEXT) IS
'Enhanced age verification logging with support for encrypted birth dates';

-- Create a view for admin users to see encryption status without exposing data
CREATE OR REPLACE VIEW profile_encryption_status AS
SELECT
  id,
  username,
  full_name,
  created_at,
  CASE
    WHEN encrypted_birth_date IS NOT NULL THEN 'encrypted'
    WHEN date_of_birth IS NOT NULL THEN 'plain_text'
    ELSE 'none'
  END as birth_date_storage_type,
  encrypted_birth_date IS NOT NULL as has_encrypted_birth_date,
  date_of_birth IS NOT NULL as has_plain_text_birth_date
FROM profiles
WHERE
  -- Only show to admins
  EXISTS (
    SELECT 1 FROM profiles admin_profiles
    WHERE admin_profiles.id = auth.uid()
    AND admin_profiles.role = 'admin'
  );

-- Grant access to the view
GRANT SELECT ON profile_encryption_status TO authenticated;