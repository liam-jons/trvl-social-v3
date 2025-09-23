-- Create CORS violations logging table for security monitoring
-- This table stores all CORS violation attempts for analysis and alerting

CREATE TABLE IF NOT EXISTS cors_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    origin TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    count INTEGER NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT,
    ip_address TEXT,
    referer TEXT,
    session_id TEXT,

    -- Metadata for analysis
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cors_violations_timestamp ON cors_violations (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_cors_violations_origin ON cors_violations (origin);
CREATE INDEX IF NOT EXISTS idx_cors_violations_severity ON cors_violations (severity);
CREATE INDEX IF NOT EXISTS idx_cors_violations_endpoint ON cors_violations (endpoint);
CREATE INDEX IF NOT EXISTS idx_cors_violations_ip_address ON cors_violations (ip_address);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cors_violations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS trigger_cors_violations_updated_at ON cors_violations;
CREATE TRIGGER trigger_cors_violations_updated_at
    BEFORE UPDATE ON cors_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_cors_violations_updated_at();

-- Add RLS (Row Level Security) policies
ALTER TABLE cors_violations ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert/update/delete violation records
CREATE POLICY "Service role can manage CORS violations" ON cors_violations
    FOR ALL USING (auth.role() = 'service_role');

-- Policy: Authenticated users can read violation statistics (admin dashboard)
CREATE POLICY "Admin users can read CORS violations" ON cors_violations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create function for CORS violation statistics
CREATE OR REPLACE FUNCTION get_cors_violation_stats(timeframe_hours INTEGER DEFAULT 24)
RETURNS JSON AS $$
DECLARE
    result JSON;
    since_timestamp TIMESTAMPTZ;
BEGIN
    since_timestamp := NOW() - (timeframe_hours || ' hours')::INTERVAL;

    SELECT json_build_object(
        'total_violations', COUNT(*),
        'unique_origins', COUNT(DISTINCT origin),
        'by_severity', (
            SELECT json_object_agg(severity, count)
            FROM (
                SELECT severity, COUNT(*) as count
                FROM cors_violations
                WHERE timestamp >= since_timestamp
                GROUP BY severity
            ) severity_counts
        ),
        'by_endpoint', (
            SELECT json_object_agg(endpoint, count)
            FROM (
                SELECT endpoint, COUNT(*) as count
                FROM cors_violations
                WHERE timestamp >= since_timestamp
                GROUP BY endpoint
                ORDER BY count DESC
                LIMIT 10
            ) endpoint_counts
        ),
        'top_offenders', (
            SELECT json_agg(json_build_object('origin', origin, 'count', count))
            FROM (
                SELECT origin, COUNT(*) as count
                FROM cors_violations
                WHERE timestamp >= since_timestamp
                GROUP BY origin
                ORDER BY count DESC
                LIMIT 10
            ) top_origins
        ),
        'recent_violations', (
            SELECT json_agg(json_build_object(
                'timestamp', timestamp,
                'origin', origin,
                'endpoint', endpoint,
                'severity', severity,
                'method', method
            ))
            FROM (
                SELECT timestamp, origin, endpoint, severity, method
                FROM cors_violations
                WHERE timestamp >= since_timestamp
                ORDER BY timestamp DESC
                LIMIT 20
            ) recent
        )
    ) INTO result
    FROM cors_violations
    WHERE timestamp >= since_timestamp;

    RETURN COALESCE(result, json_build_object('total_violations', 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old CORS violations (retain 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_cors_violations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cors_violations
    WHERE timestamp < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup operation
    INSERT INTO cors_violations (origin, endpoint, method, severity, user_agent)
    VALUES ('system', '/cleanup', 'SYSTEM', 'low', 'cleanup-job')
    ON CONFLICT DO NOTHING;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to be called by Edge Functions for logging violations
CREATE OR REPLACE FUNCTION log_cors_violation(
    p_origin TEXT,
    p_endpoint TEXT,
    p_method TEXT,
    p_severity TEXT DEFAULT 'low',
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_referer TEXT DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    violation_id UUID;
BEGIN
    INSERT INTO cors_violations (
        origin, endpoint, method, severity,
        user_agent, ip_address, referer, session_id
    ) VALUES (
        p_origin, p_endpoint, p_method, p_severity,
        p_user_agent, p_ip_address, p_referer, p_session_id
    ) RETURNING id INTO violation_id;

    RETURN violation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON cors_violations TO authenticated;
GRANT EXECUTE ON FUNCTION get_cors_violation_stats TO authenticated;
GRANT EXECUTE ON FUNCTION log_cors_violation TO anon, authenticated, service_role;

-- Comment on table for documentation
COMMENT ON TABLE cors_violations IS 'Logs all CORS policy violations for security monitoring and analysis';
COMMENT ON COLUMN cors_violations.severity IS 'Violation severity: low, medium, high, critical';
COMMENT ON COLUMN cors_violations.count IS 'Number of violations from this origin in current session';
COMMENT ON FUNCTION get_cors_violation_stats IS 'Returns aggregated CORS violation statistics for admin dashboard';
COMMENT ON FUNCTION log_cors_violation IS 'Logs a CORS violation with metadata for monitoring';
COMMENT ON FUNCTION cleanup_old_cors_violations IS 'Removes CORS violation records older than 30 days';