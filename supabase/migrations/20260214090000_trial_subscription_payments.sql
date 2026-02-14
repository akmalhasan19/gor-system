ALTER TABLE venues
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan_type DEFAULT 'STARTER',
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_type DEFAULT 'TRIAL',
ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pending_subscription_plan subscription_plan_type,
ADD COLUMN IF NOT EXISTS pending_subscription_effective_date TIMESTAMPTZ;

UPDATE venues
SET subscription_valid_until = COALESCE(created_at, NOW()) + INTERVAL '7 days'
WHERE subscription_status = 'TRIAL'
  AND subscription_valid_until IS NULL;

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    target_plan subscription_plan_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED')),
    external_id TEXT NOT NULL,
    xendit_id TEXT,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('QRIS', 'VA')),
    payment_channel TEXT,
    xendit_qr_string TEXT,
    xendit_virtual_account_number TEXT,
    xendit_expiry_date TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION update_subscription_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscription_payments_updated_at ON subscription_payments;
CREATE TRIGGER trigger_update_subscription_payments_updated_at
    BEFORE UPDATE ON subscription_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_payments_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscription_payments_external_id
    ON subscription_payments(external_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_venue_id
    ON subscription_payments(venue_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_status
    ON subscription_payments(status);

ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subscription payments in own venue" ON subscription_payments;
CREATE POLICY "Users can view subscription payments in own venue"
    ON subscription_payments
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM user_venues
            WHERE user_venues.venue_id = subscription_payments.venue_id
              AND user_venues.user_id = auth.uid()
        )
    );

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND tablename = 'subscription_payments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE subscription_payments;
    END IF;
END $$;

ALTER TABLE subscription_payments REPLICA IDENTITY FULL;