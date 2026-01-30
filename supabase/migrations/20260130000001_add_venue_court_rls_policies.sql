-- Add RLS policies for authenticated users to manage venues and courts
-- This migration allows users to create venues during onboarding

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON venues;
DROP POLICY IF EXISTS "Authenticated users can update their venues" ON venues;
DROP POLICY IF EXISTS "Authenticated users can delete their venues" ON venues;
DROP POLICY IF EXISTS "Authenticated users can insert courts" ON courts;
DROP POLICY IF EXISTS "Authenticated users can update courts" ON courts;
DROP POLICY IF EXISTS "Authenticated users can delete courts" ON courts;

-- VENUES POLICIES
-- Allow authenticated users to create venues (for onboarding)
CREATE POLICY "Authenticated users can insert venues"
    ON venues
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update venues they own
CREATE POLICY "Authenticated users can update their venues"
    ON venues
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = venues.id
            AND user_venues.user_id = auth.uid()
            AND user_venues.role IN ('owner', 'admin')
        )
    );

-- Allow authenticated users to delete venues they own
CREATE POLICY "Authenticated users can delete their venues"
    ON venues
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = venues.id
            AND user_venues.user_id = auth.uid()
            AND user_venues.role = 'owner'
        )
    );

-- Allow authenticated users to view venues they have access to
DROP POLICY IF EXISTS "Authenticated users can view their venues" ON venues;
CREATE POLICY "Authenticated users can view their venues"
    ON venues
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = venues.id
            AND user_venues.user_id = auth.uid()
        )
    );

-- COURTS POLICIES
-- Allow authenticated users to create courts for their venues
CREATE POLICY "Authenticated users can insert courts"
    ON courts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = courts.venue_id
            AND user_venues.user_id = auth.uid()
            AND user_venues.role IN ('owner', 'admin')
        )
    );

-- Allow authenticated users to update courts in their venues
CREATE POLICY "Authenticated users can update courts"
    ON courts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = courts.venue_id
            AND user_venues.user_id = auth.uid()
            AND user_venues.role IN ('owner', 'admin')
        )
    );

-- Allow authenticated users to delete courts in their venues
CREATE POLICY "Authenticated users can delete courts"
    ON courts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = courts.venue_id
            AND user_venues.user_id = auth.uid()
            AND user_venues.role IN ('owner', 'admin')
        )
    );

-- Allow authenticated users to view courts in their venues
DROP POLICY IF EXISTS "Authenticated users can view their courts" ON courts;
CREATE POLICY "Authenticated users can view their courts"
    ON courts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_venues
            WHERE user_venues.venue_id = courts.venue_id
            AND user_venues.user_id = auth.uid()
        )
    );
