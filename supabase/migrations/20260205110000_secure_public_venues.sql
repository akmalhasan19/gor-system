REVOKE SELECT ON venues FROM anon, authenticated, public;

GRANT SELECT ON venues TO authenticated;

GRANT SELECT (
    id,
    name,
    address,
    phone,
    email,
    operating_hours_start,
    operating_hours_end,
    is_active,
    latitude,
    longitude,
    city,
    booking_tolerance,
    min_dp_percentage,
    overtime_policy,
    winback_configuration,
    deposit_policy,
    photo_url,
    xendit_account_id,
    created_at,
    updated_at
) ON venues TO anon;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Public can view active venues'
    ) THEN
        CREATE POLICY "Public can view active venues" 
        ON venues 
        FOR SELECT 
        TO anon 
        USING (is_active = true);
    END IF;
END $$;