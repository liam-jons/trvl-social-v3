-- Migration: Add Onboarding Tracking to Profiles Table
-- Description: Add columns to track user onboarding completion status
-- Fixes: 404 error on /onboarding route - onboarding service requires these columns

-- Add onboarding tracking columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Create index for performance (queries often filter by onboarding_completed)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
ON profiles(onboarding_completed)
WHERE onboarding_completed = false;

-- Add comments for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS
'Indicates if user has completed the initial onboarding flow including personality assessment';

COMMENT ON COLUMN profiles.onboarding_completed_at IS
'Timestamp when the user completed the onboarding flow';

-- Update existing users to mark them as onboarded (they bypassed the flow)
-- Only update users created before this migration
UPDATE profiles
SET onboarding_completed = true,
    onboarding_completed_at = created_at
WHERE onboarding_completed IS NULL
   OR onboarding_completed = false;

-- Ensure new users default to false
ALTER TABLE profiles
ALTER COLUMN onboarding_completed SET DEFAULT false;
