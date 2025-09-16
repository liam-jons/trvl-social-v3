-- Migration: Fix auth trigger schema qualification for user creation
-- Description: Updates handle_new_user function with fully qualified table names to work with auth service's restricted search_path

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create the function in public schema with fully qualified table names
-- This uses SECURITY DEFINER to ensure it runs with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert into profiles with all necessary fields using fully qualified table name
  INSERT INTO public.profiles (
    id,
    email_verified,
    full_name,
    username,
    role,
    account_status,
    warning_count,
    reputation_score,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'role', 'traveler')::public.user_role,
    'active'::varchar(20),
    0,
    100,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Safety: prevent duplicate key errors

  -- Insert user preferences with defaults using fully qualified table name
  INSERT INTO public.user_preferences (
    user_id,
    email_notifications,
    push_notifications,
    sms_notifications,
    whatsapp_notifications,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    true,
    true,
    false,
    true,
    NOW(),
    NOW()
  )
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

-- Create trigger attached to auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();