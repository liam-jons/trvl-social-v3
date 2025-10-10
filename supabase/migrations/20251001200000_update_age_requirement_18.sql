-- Migration: Update Age Requirement from 13 to 18
-- Description: Remove COPPA compliance and implement standard 18+ age requirement
-- Date: 2025-10-01

-- Drop existing age constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS check_minimum_age;

-- Add new CHECK constraint to ensure users are at least 18 years old
ALTER TABLE profiles
ADD CONSTRAINT check_minimum_age
CHECK (
  date_of_birth IS NULL OR
  date_part('year', age(date_of_birth)) >= 18
);

-- Update the validate_age_on_update function to enforce 18+ requirement
CREATE OR REPLACE FUNCTION validate_age_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If date_of_birth is being set or updated, validate age
  IF NEW.date_of_birth IS NOT NULL THEN
    IF date_part('year', age(NEW.date_of_birth)) < 18 THEN
      RAISE EXCEPTION 'AGE_RESTRICTION: Users must be at least 18 years old. Current age: % years',
        date_part('year', age(NEW.date_of_birth))
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update constraint comment to reflect new requirement
COMMENT ON CONSTRAINT check_minimum_age ON profiles IS
'Age verification: Ensures users are at least 18 years old based on date_of_birth';

COMMENT ON FUNCTION validate_age_on_update() IS
'Validates age during profile updates to enforce 18+ age requirement';

COMMENT ON FUNCTION log_age_verification(UUID, BOOLEAN, DATE, TEXT) IS
'Logs age verification attempts for security monitoring and audit trails';
