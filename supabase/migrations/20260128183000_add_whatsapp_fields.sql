-- Add WhatsApp device tracking columns to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS wa_device_id text,
ADD COLUMN IF NOT EXISTS wa_status text DEFAULT 'disconnected'; -- 'connected', 'disconnected', 'scanned'

-- Add comment for documentation
COMMENT ON COLUMN venues.wa_device_id IS 'Fonnte Device ID (e.g. venue-slug)';
COMMENT ON COLUMN venues.wa_status IS 'Status of Fonnte connection';
