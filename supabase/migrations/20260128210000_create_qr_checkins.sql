-- Migration: Create qr_checkins table for tracking member QR scan events
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS qr_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    check_in_date DATE NOT NULL,
    venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one check-in per member per day
    CONSTRAINT unique_member_date UNIQUE (member_id, check_in_date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_qr_checkins_member_date ON qr_checkins(member_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_venue ON qr_checkins(venue_id);

-- Enable RLS
ALTER TABLE qr_checkins ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for member self-scan verification)
DROP POLICY IF EXISTS "Allow public insert" ON qr_checkins;
CREATE POLICY "Allow public insert" ON qr_checkins
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow public reads (for operator polling)
DROP POLICY IF EXISTS "Allow public read" ON qr_checkins;
CREATE POLICY "Allow public read" ON qr_checkins
    FOR SELECT
    TO anon
    USING (true);

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated full access" ON qr_checkins;
CREATE POLICY "Allow authenticated full access" ON qr_checkins
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Comment
COMMENT ON TABLE qr_checkins IS 'Tracks member QR code scan events for real-time check-in confirmation';
