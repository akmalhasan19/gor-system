-- Add reminder_configuration column to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS reminder_configuration JSONB DEFAULT '{
    "warnings": [
        {"days_before": 30, "enabled": true},
        {"days_before": 7, "enabled": true}
    ],
    "expired_message_enabled": true
}'::jsonb;

-- Comment on column
COMMENT ON COLUMN venues.reminder_configuration IS 'Configuration for automated member renewal reminders';
