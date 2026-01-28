-- Fix RLS policies for user_venues to allow Team Management
-- Previous policies were too restrictive (only allowed modifying self)

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their venue associations" ON user_venues;
DROP POLICY IF EXISTS "Users can create venue associations during onboarding" ON user_venues;
DROP POLICY IF EXISTS "Owners can update venue associations" ON user_venues;
DROP POLICY IF EXISTS "Owners can delete venue associations" ON user_venues;

-- 2. Create new comprehensive policies

-- SELECT: Users can view ALL members of venues they belong to
CREATE POLICY "Users can view members of their venues"
    ON user_venues FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );

-- INSERT: Users can register themselves (Onboarding) OR Owners can add staff
CREATE POLICY "Manage venue memberships"
    ON user_venues FOR INSERT
    WITH CHECK (
        -- Allow user to add themselves (Onboarding)
        auth.uid() = user_id
        OR
        -- Allow Owner to add others to their venue
        EXISTS (
            SELECT 1 FROM user_venues uv
            WHERE uv.venue_id = venue_id
            AND uv.user_id = auth.uid()
            AND uv.role = 'owner'
        )
    );

-- UPDATE: Only Owners can update members in their venue
CREATE POLICY "Owners can update venue members"
    ON user_venues FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_venues uv
            WHERE uv.venue_id = venue_id
            AND uv.user_id = auth.uid()
            AND uv.role = 'owner'
        )
    );

-- DELETE: Only Owners can remove members from their venue
CREATE POLICY "Owners can delete venue members"
    ON user_venues FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_venues uv
            WHERE uv.venue_id = venue_id
            AND uv.user_id = auth.uid()
            AND uv.role = 'owner'
        )
    );
