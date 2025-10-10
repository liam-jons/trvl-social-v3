-- =============================================================================
-- MANUAL FIX: handle_new_user Function Schema Qualification
-- =============================================================================
-- Run this SQL directly in Supabase SQL Editor to fix user registration errors
--
-- Issue: The handle_new_user trigger function uses unqualified table names
--        (e.g., "profiles" instead of "public.profiles"), which causes
--        "relation profiles does not exist" errors when running as supabase_auth_admin
--
-- This script fixes the function to use fully qualified table names and
-- follows Supabase best practices with SECURITY DEFINER and empty search_path
-- =============================================================================

-- Drop the existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the corrected function with proper schema qualification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Empty search_path for security (Supabase best practice)
AS $$
BEGIN
  -- Insert into profiles with FULLY QUALIFIED table name (public.profiles)
  -- Only insert required fields, let others use table DEFAULT values
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
    -- Only set plain text date if no encrypted version provided
    CASE
      WHEN NEW.raw_user_meta_data->>'encrypted_birth_date' IS NOT NULL THEN NULL
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
        THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    -- Set encrypted birth date if provided
    NEW.raw_user_meta_data->>'encrypted_birth_date'
  )
  ON CONFLICT (id) DO NOTHING; -- Safety: prevent duplicate key errors

  -- Insert user preferences with FULLY QUALIFIED table name (public.user_preferences)
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING; -- Safety: prevent duplicate key errors

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error for debugging but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow user creation to proceed
    RETURN NEW;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, service_role;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add documentation comment
COMMENT ON FUNCTION public.handle_new_user() IS
'Creates profile and user preferences for new users. Uses fully qualified table names (public.profiles, public.user_preferences) to avoid search_path issues when running as supabase_auth_admin. Follows Supabase security best practices with SECURITY DEFINER and empty search_path.';

-- =============================================================================
-- VERIFICATION
-- =============================================================================
-- After running this script, verify the function was updated:
--
-- SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';
--
-- You should see "public.profiles" and "public.user_preferences" in the output
-- =============================================================================
