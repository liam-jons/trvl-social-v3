-- Create age verification logs table
-- This should be run before other age verification migrations

-- Create the age verification logs table first
CREATE TABLE IF NOT EXISTS age_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  verification_date TIMESTAMPTZ DEFAULT NOW(),
  date_of_birth DATE,
  calculated_age INTEGER,
  verification_result BOOLEAN,
  error_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user_id
ON age_verification_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_age_verification_logs_created_at
ON age_verification_logs(created_at DESC);

-- Enable RLS
ALTER TABLE age_verification_logs ENABLE ROW LEVEL SECURITY;

-- Add RLS policy (only admins can view)
CREATE POLICY "Only admins can view age verification logs"
  ON age_verification_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON age_verification_logs TO authenticated;

-- Add comment
COMMENT ON TABLE age_verification_logs IS 'Logs age verification attempts for COPPA compliance monitoring';