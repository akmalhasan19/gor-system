-- Add location fields to venues table for location-based filtering
-- These fields enable the frontend to calculate distances using Haversine formula

ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN venues.latitude IS 'Latitude coordinate of the venue location';
COMMENT ON COLUMN venues.longitude IS 'Longitude coordinate of the venue location';
COMMENT ON COLUMN venues.city IS 'City name for display purposes on the frontend';

-- Note: These columns are nullable for backward compatibility
-- Venues without coordinates will still appear in the frontend (benefit of doubt)
