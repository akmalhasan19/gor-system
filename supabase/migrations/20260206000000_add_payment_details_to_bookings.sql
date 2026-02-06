-- Add payment_details JSONB column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;