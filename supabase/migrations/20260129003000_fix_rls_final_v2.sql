CREATE OR REPLACE FUNCTION public.get_auth_user_venue_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT venue_id FROM user_venues WHERE user_id = auth.uid();
$$;
DROP POLICY IF EXISTS "Users can view members of their venues" ON user_venues;
DROP POLICY IF EXISTS "Users can view teammates" ON user_venues;
DROP POLICY IF EXISTS "Users can view own venue" ON user_venues;
DROP POLICY IF EXISTS "Users can view their venue associations" ON user_venues;

CREATE POLICY "Users can view own venue"
    ON user_venues FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view teammates"
    ON user_venues FOR SELECT
    USING (
        venue_id IN ( SELECT get_auth_user_venue_ids() )
    );