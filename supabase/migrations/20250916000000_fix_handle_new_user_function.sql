-- Migration: Fix handle_new_user function to match current schema
-- Description: Updates the handle_new_user function to properly handle all columns added by later migrations

-- Drop and recreate the function with proper column handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles with all necessary fields
  INSERT INTO profiles (
    id,
    email_verified,
    full_name,
    username,
    role,
    account_status,
    warning_count,
    reputation_score
  )
  VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'traveler')::user_role,
    'active',
    0,
    100
  );

  -- Insert user preferences with defaults
  INSERT INTO user_preferences (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    whatsapp_notifications
  )
  VALUES (
    NEW.id,
    true,
    true,
    false,
    true
  );

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Re-raise the error to see what's happening
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also ensure the trigger exists and is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();