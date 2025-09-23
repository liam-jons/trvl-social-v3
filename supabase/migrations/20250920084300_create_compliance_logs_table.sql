-- Create compliance_logs table for COPPA compliance tracking
-- This table stores age verification and registration attempts for compliance monitoring

CREATE TABLE IF NOT EXISTS public.compliance_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Event information
    event_type text NOT NULL,
    event_data jsonb NOT NULL DEFAULT '{}',
    metadata jsonb NOT NULL DEFAULT '{}',

    -- Session tracking
    session_id text,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_logs_event_type ON public.compliance_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_created_at ON public.compliance_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_session_id ON public.compliance_logs (session_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_compliance_logs_event_date ON public.compliance_logs (event_type, created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.compliance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only allow system/admin users to access compliance logs
-- Regular users should not be able to access compliance logs
CREATE POLICY "Admin access only for compliance logs" ON public.compliance_logs
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'role' = 'admin' OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add table comment
COMMENT ON TABLE public.compliance_logs IS 'Stores compliance-related events for COPPA age verification monitoring';

-- Add column comments
COMMENT ON COLUMN public.compliance_logs.event_type IS 'Type of compliance event (age_verification_attempt, registration_attempt, etc.)';
COMMENT ON COLUMN public.compliance_logs.event_data IS 'Event-specific data (age, error codes, etc.) - no PII stored';
COMMENT ON COLUMN public.compliance_logs.metadata IS 'Additional metadata (user agent, origin, etc.) - sanitized';
COMMENT ON COLUMN public.compliance_logs.session_id IS 'Session identifier for tracking related events';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compliance_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_compliance_logs_updated_at
    BEFORE UPDATE ON public.compliance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_logs_updated_at();

-- Create a view for compliance reporting (admin only)
CREATE OR REPLACE VIEW public.compliance_metrics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    event_type,
    COUNT(*) as event_count,
    COUNT(CASE WHEN event_data->>'result' = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN event_data->>'result' = 'failure' THEN 1 END) as failure_count,
    COUNT(CASE WHEN event_data->>'is_underage' = 'true' THEN 1 END) as underage_attempts,
    AVG(CASE WHEN event_data->>'calculated_age' IS NOT NULL
        THEN (event_data->>'calculated_age')::int
        ELSE NULL END) as avg_age
FROM public.compliance_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), event_type
ORDER BY date DESC, event_type;

-- RLS for the view
ALTER VIEW public.compliance_metrics SET (security_invoker = true);

-- Grant permissions
GRANT SELECT ON public.compliance_logs TO authenticated;
GRANT INSERT ON public.compliance_logs TO authenticated;
GRANT SELECT ON public.compliance_metrics TO authenticated;

-- Grant all permissions to service role for edge functions
GRANT ALL ON public.compliance_logs TO service_role;
GRANT ALL ON public.compliance_metrics TO service_role;