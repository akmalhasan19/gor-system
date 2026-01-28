- Migration: Create reminder_logs table for tracking member renewal reminders
-- Date: 2026-01-28

-- Table to store reminder logs
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('30_DAYS', '7_DAYS', 'EXPIRED', 'MANUAL')),
    channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'SMS', 'EMAIL')),
    message_content TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ')),
    external_message_id TEXT, -- ID from WhatsApp API provider
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_reminder_logs_venue_id ON reminder_logs(venue_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_customer_id ON reminder_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_status ON reminder_logs(status);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_created_at ON reminder_logs(created_at);

-- Enable RLS
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reminder logs for their venues"
    ON reminder_logs FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reminder logs for their venues"
    ON reminder_logs FOR INSERT
    WITH CHECK (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reminder logs for their venues"
    ON reminder_logs FOR UPDATE
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminder_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_reminder_logs_updated_at
    BEFORE UPDATE ON reminder_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_reminder_logs_updated_at();

-- Enable realtime for reminder_logs
ALTER PUBLICATION supabase_realtime ADD TABLE reminder_logs;
