-- =============================================================================
-- MANUAL FIX: Apply All Critical Migrations
-- =============================================================================
-- Run this SQL directly in Supabase SQL Editor to apply all pending migrations
-- This includes fixes for:
-- 1. handle_new_user schema qualification (user registration)
-- 2. Missing vendors/trip_requests columns (400 errors)
-- 3. Onboarding tracking columns (404 error)
-- =============================================================================

-- =============================================================================
-- MIGRATION 1: Fix handle_new_user Schema Qualification
-- =============================================================================

-- Drop and recreate the function with proper schema qualification
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
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
    CASE
      WHEN NEW.raw_user_meta_data->>'encrypted_birth_date' IS NOT NULL THEN NULL
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
        THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'encrypted_birth_date'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, service_role;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Creates profile and user preferences for new users. Uses fully qualified table names to avoid search_path issues.';

-- =============================================================================
-- MIGRATION 2: Fix vendors and trip_requests Schema
-- =============================================================================

-- Add missing columns to vendors table
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS specialties TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Add missing column to trip_requests table
ALTER TABLE trip_requests
ADD COLUMN IF NOT EXISTS title TEXT;

-- Auto-populate title from description for existing records
UPDATE trip_requests
SET title = CASE
  WHEN length(description) > 50 THEN substring(description from 1 for 47) || '...'
  ELSE description
END
WHERE title IS NULL AND description IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN vendors.avatar_url IS 'URL to vendor logo/avatar image';
COMMENT ON COLUMN vendors.specialties IS 'Array of service specialties offered by the vendor';
COMMENT ON COLUMN vendors.certifications IS 'Array of certification names held by the vendor';
COMMENT ON COLUMN trip_requests.title IS 'Short display title for the trip request (auto-generated from description if not provided)';

-- =============================================================================
-- MIGRATION 3: Add Onboarding Tracking Columns
-- =============================================================================

-- Add onboarding tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON profiles(onboarding_completed)
WHERE onboarding_completed = false;

-- Add comments
COMMENT ON COLUMN profiles.onboarding_completed IS
'Indicates if user has completed the initial onboarding flow including personality assessment';

COMMENT ON COLUMN profiles.onboarding_completed_at IS
'Timestamp when the user completed the onboarding flow';

-- Update existing users to mark them as onboarded (they bypassed the flow)
UPDATE profiles
SET onboarding_completed = true,
    onboarding_completed_at = created_at
WHERE onboarding_completed IS NULL
   OR onboarding_completed = false;

-- Ensure new users default to false
ALTER TABLE profiles
ALTER COLUMN onboarding_completed SET DEFAULT false;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this script, verify the changes:

-- Check handle_new_user function:
-- SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';

-- Check vendors columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'vendors' AND column_name IN ('avatar_url', 'specialties', 'certifications');

-- Check trip_requests columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'trip_requests' AND column_name = 'title';

-- Check profiles onboarding columns:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'profiles' AND column_name IN ('onboarding_completed', 'onboarding_completed_at');

-- =============================================================================
-- COMPLETE!
-- =============================================================================
