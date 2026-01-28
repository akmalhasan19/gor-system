-- FIX: The previous RLS policy created an infinite recursion for SELECTs
-- This caused the middleware to fail to find the user's venue, redirecting to onboarding.

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Users can view members of their venues" ON user_venues;

-- 2. Restore the simple "View Self" policy (Base case to break recursion)
-- This allows the user to ALWAYS see their own row, which is needed for the middleware check.
DROP POLICY IF EXISTS "Users can view own venue" ON user_venues;
CREATE POLICY "Users can view own venue"
    ON user_venues FOR SELECT
    USING (auth.uid() = user_id);

-- 3. Add the "View Teammates" policy separately
-- The subquery here will now succeed because "Users can view own venue" exists.
DROP POLICY IF EXISTS "Users can view teammates" ON user_venues;
CREATE POLICY "Users can view teammates"
    ON user_venues FOR SELECT
    USING (
        venue_id IN (
            SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
        )
    );
