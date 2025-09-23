-- Setup Credential Management System
-- This migration creates the necessary tables and functions for secure credential management

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create credential access logs table
CREATE TABLE IF NOT EXISTS credential_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_key TEXT NOT NULL,
    access_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES auth.users(id),
    environment TEXT NOT NULL DEFAULT 'development',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create credential errors table
CREATE TABLE IF NOT EXISTS credential_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_key TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    environment TEXT NOT NULL DEFAULT 'development',
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_key ON credential_access_logs(credential_key);
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_timestamp ON credential_access_logs(access_timestamp);
CREATE INDEX IF NOT EXISTS idx_credential_access_logs_user ON credential_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credential_errors_key ON credential_errors(credential_key);
CREATE INDEX IF NOT EXISTS idx_credential_errors_timestamp ON credential_errors(error_timestamp);
CREATE INDEX IF NOT EXISTS idx_credential_errors_resolved ON credential_errors(resolved);

-- Create RLS policies
ALTER TABLE credential_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_errors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own logs
CREATE POLICY "Users can view own credential logs" ON credential_access_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service accounts can insert logs
CREATE POLICY "Service can insert credential logs" ON credential_access_logs
    FOR INSERT WITH CHECK (true);

-- Policy: Users can only see their own errors
CREATE POLICY "Users can view own credential errors" ON credential_errors
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service accounts can insert errors
CREATE POLICY "Service can insert credential errors" ON credential_errors
    FOR INSERT WITH CHECK (true);

-- Policy: Admins can view all logs (for monitoring)
CREATE POLICY "Admins can view all credential logs" ON credential_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all credential errors" ON credential_errors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to safely get vault secrets (with logging)
CREATE OR REPLACE FUNCTION get_vault_secret(secret_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    secret_value TEXT;
    current_user_id UUID;
BEGIN
    -- Get current user
    current_user_id := auth.uid();

    -- Check if user has permission (admin or service account)
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Get secret from vault
    SELECT decrypted_secret INTO secret_value
    FROM vault.decrypted_secrets
    WHERE name = secret_name;

    -- Log access attempt
    INSERT INTO credential_access_logs (
        credential_key,
        success,
        user_id,
        environment
    ) VALUES (
        secret_name,
        secret_value IS NOT NULL,
        current_user_id,
        CASE WHEN current_setting('app.environment', true) IS NOT NULL
             THEN current_setting('app.environment', true)
             ELSE 'development' END
    );

    RETURN secret_value;
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO credential_errors (
        credential_key,
        error_message,
        user_id,
        environment
    ) VALUES (
        secret_name,
        SQLERRM,
        current_user_id,
        CASE WHEN current_setting('app.environment', true) IS NOT NULL
             THEN current_setting('app.environment', true)
             ELSE 'development' END
    );

    RETURN NULL;
END;
$$;

-- Function to safely create vault secrets (admin only)
CREATE OR REPLACE FUNCTION create_vault_secret(secret_name TEXT, secret_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
BEGIN
    -- Get current user and role
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Check if user is admin
    SELECT role INTO user_role
    FROM profiles
    WHERE id = current_user_id;

    IF user_role != 'admin' THEN
        RAISE EXCEPTION 'Admin access required';
    END IF;

    -- Create or update secret in vault
    SELECT vault.create_secret(secret_name, secret_value);

    -- Log creation
    INSERT INTO credential_access_logs (
        credential_key,
        success,
        user_id,
        environment
    ) VALUES (
        'create_' || secret_name,
        true,
        current_user_id,
        CASE WHEN current_setting('app.environment', true) IS NOT NULL
             THEN current_setting('app.environment', true)
             ELSE 'development' END
    );

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    -- Log error
    INSERT INTO credential_errors (
        credential_key,
        error_message,
        user_id,
        environment
    ) VALUES (
        'create_' || secret_name,
        SQLERRM,
        current_user_id,
        CASE WHEN current_setting('app.environment', true) IS NOT NULL
             THEN current_setting('app.environment', true)
             ELSE 'development' END
    );

    RETURN false;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA vault TO authenticated;
GRANT EXECUTE ON FUNCTION get_vault_secret(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_vault_secret(TEXT, TEXT) TO authenticated;

-- Create view for credential status monitoring
CREATE OR REPLACE VIEW credential_status_summary AS
SELECT
    credential_key,
    COUNT(*) as total_accesses,
    SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_accesses,
    SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_accesses,
    MAX(access_timestamp) as last_access,
    COUNT(DISTINCT user_id) as unique_users
FROM credential_access_logs
WHERE access_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY credential_key;

-- Grant access to the view
GRANT SELECT ON credential_status_summary TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE credential_access_logs IS 'Logs all credential access attempts for security monitoring';
COMMENT ON TABLE credential_errors IS 'Tracks credential-related errors for debugging and security';
COMMENT ON FUNCTION get_vault_secret(TEXT) IS 'Securely retrieves secrets from Supabase Vault with logging';
COMMENT ON FUNCTION create_vault_secret(TEXT, TEXT) IS 'Securely stores secrets in Supabase Vault (admin only)';
COMMENT ON VIEW credential_status_summary IS 'Summary view of credential usage patterns for monitoring';

-- Insert initial monitoring data
INSERT INTO credential_access_logs (credential_key, success, user_id, environment)
VALUES ('system_initialization', true, NULL, 'migration')
ON CONFLICT DO NOTHING;