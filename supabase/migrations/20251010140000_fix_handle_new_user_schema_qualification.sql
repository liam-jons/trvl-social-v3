-- Migration: Fix handle_new_user Schema Qualification
-- Description: Update handle_new_user function to use fully qualified table names
--              This fixes "relation profiles does not exist" errors when running as supabase_auth_admin
-- Issue: Previous migrations overwrote the schema qualification fix from 20250916000000

-- Drop and recreate the function with proper schema qualification
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function with SECURITY DEFINER and empty search_path (Supabase best practice)
-- This requires all table references to be fully schema-qualified
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles with fully qualified table name
  -- Only insert id, email_verified, full_name, and birth date fields
  -- Let other columns use their DEFAULT values from the table definition
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
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL THEN (NEW.raw_user_meta_data->>'date_of_birth')::DATE
      ELSE NULL
    END,
    -- Set encrypted birth date if provided
    NEW.raw_user_meta_data->>'encrypted_birth_date'
  )
  ON CONFLICT (id) DO NOTHING; -- Safety: prevent duplicate key errors

  -- Insert user preferences with fully qualified table name
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

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, service_role;

-- Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS
'Creates profile and user preferences for new users. Uses fully qualified table names to avoid search_path issues.';
