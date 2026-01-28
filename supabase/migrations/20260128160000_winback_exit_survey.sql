-- Migration: Win-back Promo & Exit Survey System
-- Date: 2026-01-28
-- Purpose: Store win-back promo logs and exit survey responses for member retention

-- ============================================
-- Table: winback_promo_logs
-- Stores history of win-back promos sent to at-risk members
-- ============================================
CREATE TABLE IF NOT EXISTS winback_promo_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'medium', 'low')),
    promo_code TEXT NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 10,
    valid_until DATE,
    message_content TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'REDEEMED', 'EXPIRED')),
    external_message_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for winback_promo_logs
CREATE INDEX IF NOT EXISTS idx_winback_promo_logs_venue_id ON winback_promo_logs(venue_id);
CREATE INDEX IF NOT EXISTS idx_winback_promo_logs_customer_id ON winback_promo_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_winback_promo_logs_promo_code ON winback_promo_logs(promo_code);
CREATE INDEX IF NOT EXISTS idx_winback_promo_logs_status ON winback_promo_logs(status);

-- Enable RLS for winback_promo_logs
ALTER TABLE winback_promo_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for winback_promo_logs
CREATE POLICY "Users can view winback logs for their venues"
    ON winback_promo_logs FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert winback logs for their venues"
    ON winback_promo_logs FOR INSERT
    WITH CHECK (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update winback logs for their venues"
    ON winback_promo_logs FOR UPDATE
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Table: exit_surveys
-- Stores exit survey responses from members who didn't renew
-- ============================================
CREATE TABLE IF NOT EXISTS exit_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reasons TEXT[] NOT NULL DEFAULT '{}',
    other_reason TEXT,
    feedback TEXT,
    membership_expiry DATE,
    survey_sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for exit_surveys
CREATE INDEX IF NOT EXISTS idx_exit_surveys_venue_id ON exit_surveys(venue_id);
CREATE INDEX IF NOT EXISTS idx_exit_surveys_customer_id ON exit_surveys(customer_id);
CREATE INDEX IF NOT EXISTS idx_exit_surveys_completed_at ON exit_surveys(completed_at);

-- Enable RLS for exit_surveys
ALTER TABLE exit_surveys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exit_surveys (allow public insert for survey submission)
CREATE POLICY "Users can view exit surveys for their venues"
    ON exit_surveys FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert exit surveys"
    ON exit_surveys FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update exit surveys for their venues"
    ON exit_surveys FOR UPDATE
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- Add winback_configuration column to venues table
-- Stores: promo code format, discount %, validity days, enabled flag
-- ============================================
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS winback_configuration JSONB DEFAULT '{
    "enabled": false,
    "promo_code_prefix": "COMEBACK",
    "promo_code_suffix_length": 6,
    "default_discount_percent": 15,
    "validity_days": 7,
    "auto_send_enabled": false,
    "message_template": "Halo {name}! 👋\n\nKami kangen sama kamu di {venue}! 🏸\n\nGunakan kode promo *{promo_code}* untuk dapat diskon *{discount}%* booking lapangan.\n\nBerlaku sampai {valid_until}.\n\nYuk main lagi! 💪"
}'::jsonb;

-- ============================================
-- Update trigger for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_winback_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_winback_logs_updated_at
    BEFORE UPDATE ON winback_promo_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_winback_logs_updated_at();

CREATE OR REPLACE FUNCTION update_exit_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exit_surveys_updated_at
    BEFORE UPDATE ON exit_surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_exit_surveys_updated_at();

-- ============================================
-- Enable realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE winback_promo_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE exit_surveys;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE winback_promo_logs IS 'Stores win-back promo messages sent to at-risk members';
COMMENT ON TABLE exit_surveys IS 'Stores exit survey responses from members who did not renew';
COMMENT ON COLUMN venues.winback_configuration IS 'JSON configuration for win-back promo feature including code format and templates';
