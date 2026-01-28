-- Migration: Add helper view for member activity analysis
-- This is optional - the main analysis is done in the frontend API
-- But having this can be useful for future database-level analytics

-- Create a view for member booking statistics
-- Note: This view can be queried directly for advanced analytics

CREATE OR REPLACE VIEW member_booking_stats AS
SELECT 
    c.id as customer_id,
    c.venue_id,
    c.name,
    c.phone,
    c.is_member,
    c.quota,
    c.membership_expiry,
    MAX(b.booking_date) as last_booking_date,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.booking_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as bookings_last_30_days,
    COUNT(CASE WHEN b.booking_date >= CURRENT_DATE - INTERVAL '60 days' AND b.booking_date < CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as bookings_prev_30_days,
    COUNT(CASE WHEN b.booking_date >= CURRENT_DATE - INTERVAL '90 days' THEN 1 END) as bookings_last_90_days
FROM customers c
LEFT JOIN bookings b ON b.phone = c.phone AND b.venue_id = c.venue_id
WHERE c.is_member = true AND c.is_deleted = false
GROUP BY c.id, c.venue_id, c.name, c.phone, c.is_member, c.quota, c.membership_expiry;

-- Add comment
COMMENT ON VIEW member_booking_stats IS 'Aggregated view of member booking activity for churn analysis';

-- Create index on bookings phone for faster member lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(phone);

-- Create index on customers phone for faster joins
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
