-- Add missing columns to venues table found during debugging
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS booking_tolerance INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS overtime_policy TEXT DEFAULT 'charge' CHECK (overtime_policy IN ('allow', 'charge', 'strict')),
ADD COLUMN IF NOT EXISTS wa_notification_time TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS fonnte_token TEXT,
ADD COLUMN IF NOT EXISTS wa_template_reminder TEXT;
