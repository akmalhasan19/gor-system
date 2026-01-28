-- NUCLEAR FIX for RLS Infinite Recursion on INSERT/UPDATE
-- The previous fixes handled SELECT, but INSERT/UPDATE policies also trigger SELECTs, causing recursion.
-- We will replace ALL policies with pure Security Definer function calls.

-- 1. Helper Function: Is the current user an owner of the given venue?
-- This function runs with elevated privileges (SECURITY DEFINER) and does NOT trigger RLS.
CREATE OR REPLACE FUNCTION public.is_venue_owner(target_venue_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_venues 
    WHERE user_id = auth.uid() 
      AND venue_id = target_venue_id 
      AND role = 'owner'
  );
END;
$$;

-- 2. Helper Function: Get all venue IDs the current user belongs to
-- (Already created in previous migration as get_auth_user_venue_ids, but ensuring it exists and consistent)
CREATE OR REPLACE FUNCTION public.get_my_venue_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT venue_id FROM user_venues WHERE user_id = auth.uid();
$$;

-- 3. DROP ALL EXISTING POLICIES to ensure a clean slate
DROP POLICY IF EXISTS "Users can view members of their venues" ON user_venues;
DROP POLICY IF EXISTS "Users can view teammates" ON user_venues;
DROP POLICY IF EXISTS "Users can view own venue" ON user_venues;
DROP POLICY IF EXISTS "Users can view their venue associations" ON user_venues;
DROP POLICY IF EXISTS "Users can create venue associations during onboarding" ON user_venues;
DROP POLICY IF EXISTS "Manage venue memberships" ON user_venues;
DROP POLICY IF EXISTS "Owners can update venue members" ON user_venues;
DROP POLICY IF EXISTS "Owners can delete venue members" ON user_venues;
DROP POLICY IF EXISTS "Owners can update venue associations" ON user_venues;
DROP POLICY IF EXISTS "Owners can delete venue associations" ON user_venues;

-- 4. RECREATE POLICIES using the functions

-- SELECT: 
-- A. View Own Rows (Always allowed)
CREATE POLICY "View Own Rows"
    ON user_venues FOR SELECT
    USING (auth.uid() = user_id);

-- B. View Teammates (Allowed if we share a venue)
CREATE POLICY "View Teammates"
    ON user_venues FOR SELECT
    USING (venue_id IN (SELECT get_my_venue_ids()));

-- INSERT: 
-- A. Onboarding (Adding self)
-- B. Inviting (Owner adding others)
CREATE POLICY "Insert Membership"
    ON user_venues FOR INSERT
    WITH CHECK (
        auth.uid() = user_id -- Onboarding
        OR
        is_venue_owner(venue_id) -- Owner Invite (Uses Security Definer, NO RECURSION)
    );

-- UPDATE:
-- Only Owners can update members in their venue
CREATE POLICY "Update Membership"
    ON user_venues FOR UPDATE
    USING (is_venue_owner(venue_id)); -- Security Definer check

-- DELETE:
-- Only Owners can delete members in their venue
CREATE POLICY "Delete Membership"
    ON user_venues FOR DELETE
    USING (is_venue_owner(venue_id)); -- Security Definer check
