-- Migration: Add payment timeout support
-- 1. Venues: Add min DP percentage threshold for timer exemption
-- 2. Bookings: Add in_cart_since for timer pause tracking

-- Add min_dp_percentage to venues (default 50%)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS min_dp_percentage INTEGER DEFAULT 50;

-- Add in_cart_since to bookings for timer pause
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS in_cart_since TIMESTAMPTZ;

-- Comment for documentation
COMMENT ON COLUMN venues.min_dp_percentage IS 'Minimum DP percentage (0-100) to exempt booking from auto-delete timer';
COMMENT ON COLUMN bookings.in_cart_since IS 'Timestamp when booking was added to cart (pauses auto-delete timer)';
