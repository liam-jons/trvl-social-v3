-- Migration: Add Age Verification Database Constraints
-- Description: Add server-side age verification constraints and update user creation trigger

-- Add CHECK constraint to ensure users are at least 13 years old
ALTER TABLE profiles
ADD CONSTRAINT check_minimum_age
CHECK (
  date_of_birth IS NULL OR
  date_part('year', age(date_of_birth)) >= 13
);

-- Update the handle_new_user function to include date_of_birth from metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email_verified,
    full_name,
    date_of_birth
  )
  VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END
  );

  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to validate age during profile updates
CREATE OR REPLACE FUNCTION validate_age_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If date_of_birth is being set or updated, validate age
  IF NEW.date_of_birth IS NOT NULL THEN
    IF date_part('year', age(NEW.date_of_birth)) < 13 THEN
      RAISE EXCEPTION 'COPPA_VIOLATION: Users must be at least 13 years old. Current age: % years',
        date_part('year', age(NEW.date_of_birth))
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate age on profile updates
CREATE TRIGGER validate_age_before_profile_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_age_on_update();

-- Create function to log age verification attempts (for compliance)
CREATE OR REPLACE FUNCTION log_age_verification(
  user_id UUID,
  verification_result BOOLEAN,
  date_of_birth DATE DEFAULT NULL,
  error_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO age_verification_logs (
    user_id,
    date_of_birth,
    calculated_age,
    verification_result,
    error_reason
  )
  VALUES (
    user_id,
    date_of_birth,
    CASE WHEN date_of_birth IS NOT NULL THEN date_part('year', age(date_of_birth)) ELSE NULL END,
    verification_result,
    error_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON CONSTRAINT check_minimum_age ON profiles IS
'COPPA compliance: Ensures users are at least 13 years old based on date_of_birth';

COMMENT ON FUNCTION validate_age_on_update() IS
'Validates age during profile updates to prevent circumventing age restrictions';

COMMENT ON FUNCTION log_age_verification(UUID, BOOLEAN, DATE, TEXT) IS
'Logs age verification attempts for compliance monitoring and audit trails';