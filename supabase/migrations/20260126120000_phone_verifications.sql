REATE TABLE IF NOT EXISTS phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    country_code TEXT NOT NULL DEFAULT '+62', -- Default to Indonesia
    totp_secret TEXT, -- For TOTP-based verification
    verification_code TEXT, -- For SMS OTP (hashed)
    verification_type TEXT NOT NULL DEFAULT 'totp' CHECK (verification_type IN ('totp', 'sms', 'manual')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 5,
    is_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_verified ON phone_verifications(is_verified);

-- Create unique constraint to prevent duplicate pending verifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_pending 
    ON phone_verifications(user_id, phone_number) 
    WHERE is_verified = false;

-- Rate limiting table to track OTP requests
CREATE TABLE IF NOT EXISTS phone_verification_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL,
    ip_address TEXT,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_phone ON phone_verification_rate_limits(phone_number);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON phone_verification_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON phone_verification_rate_limits(window_start);

-- Enable RLS on phone_verifications
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_verification_rate_limits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
DO $$
BEGIN
    -- Policy: Users can view their own verification records
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'phone_verifications' AND policyname = 'Users can view own verifications'
    ) THEN
        CREATE POLICY "Users can view own verifications"
            ON phone_verifications FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Policy: Allow inserting verification records during registration
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'phone_verifications' AND policyname = 'Allow insert during registration'
    ) THEN
        CREATE POLICY "Allow insert during registration"
            ON phone_verifications FOR INSERT
            WITH CHECK (true);
    END IF;

    -- Policy: Users can update their own verification records
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'phone_verifications' AND policyname = 'Users can update own verifications'
    ) THEN
        CREATE POLICY "Users can update own verifications"
            ON phone_verifications FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    -- Policy: Rate limits - service role only (for API routes)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'phone_verification_rate_limits' AND policyname = 'Service role manages rate limits'
    ) THEN
        CREATE POLICY "Service role manages rate limits"
            ON phone_verification_rate_limits FOR ALL
            USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Function to clean up expired verifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_verifications()
RETURNS void AS $$
BEGIN
    DELETE FROM phone_verifications 
    WHERE is_verified = false 
    AND expires_at < NOW();
    
    DELETE FROM phone_verification_rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on tables
COMMENT ON TABLE phone_verifications IS 'Stores phone verification attempts and TOTP secrets for user registration';
COMMENT ON TABLE phone_verification_rate_limits IS 'Rate limiting for phone verification requests';
