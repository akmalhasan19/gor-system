DO $$
DECLARE
    fn_name text;
BEGIN
    FOREACH fn_name IN ARRAY ARRAY[
        'cleanup_expired_verifications',
        'update_winback_logs_updated_at',
        'update_max_courts_on_plan_change',
        'update_platform_admins_updated_at',
        'update_reminder_logs_updated_at',
        'check_court_limit',
        'handle_new_user',
        'update_exit_surveys_updated_at',
        'update_booking_timestamps',
        'update_user_venues_updated_at',
        'update_maintenance_tasks_updated_at',
        'update_venue_leads_updated_at',
        'update_subscription_payments_updated_at'
    ] LOOP
        IF EXISTS (
            SELECT 1
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND p.proname = fn_name
              AND p.pronargs = 0
        ) THEN
            EXECUTE format(
                'ALTER FUNCTION public.%I() SET search_path = public, pg_temp',
                fn_name
            );
        END IF;
    END LOOP;
END $$;

DROP POLICY IF EXISTS "Allow all for bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow all for courts" ON public.courts;
DROP POLICY IF EXISTS "Allow all for customers" ON public.customers;
DROP POLICY IF EXISTS "Allow all for products" ON public.products;
DROP POLICY IF EXISTS "Allow all for transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow all for venues" ON public.venues;

DROP POLICY IF EXISTS "Public Create Bookings" ON public.bookings;
CREATE POLICY "Public Create Bookings"
    ON public.bookings
    FOR INSERT
    WITH CHECK (
        duration > 0
        AND EXISTS (
            SELECT 1
            FROM public.venues v
            WHERE v.id = bookings.venue_id
              AND v.is_active = true
        )
        AND (
            bookings.court_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.courts c
                WHERE c.id = bookings.court_id
                  AND c.venue_id = bookings.venue_id
                  AND c.is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Allow insert during registration" ON public.phone_verifications;
CREATE POLICY "Allow insert during registration"
    ON public.phone_verifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert exit surveys" ON public.exit_surveys;
CREATE POLICY "Anyone can insert exit surveys"
    ON public.exit_surveys
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.customers c
            WHERE c.id = exit_surveys.customer_id
              AND c.venue_id = exit_surveys.venue_id
        )
    );

DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Authenticated users can insert venues"
    ON public.venues
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.shifts;
CREATE POLICY "Enable insert access for authenticated users"
    ON public.shifts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_venues uv
            WHERE uv.user_id = auth.uid()
              AND uv.venue_id = shifts.venue_id
        )
    );

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.shifts;
CREATE POLICY "Enable update access for authenticated users"
    ON public.shifts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1
            FROM public.user_venues uv
            WHERE uv.user_id = auth.uid()
              AND uv.venue_id = shifts.venue_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.user_venues uv
            WHERE uv.user_id = auth.uid()
              AND uv.venue_id = shifts.venue_id
        )
    );

DROP POLICY IF EXISTS "Allow public insert" ON public.qr_checkins;
CREATE POLICY "Allow public insert"
    ON public.qr_checkins
    FOR INSERT
    TO anon
    WITH CHECK (
        btrim(member_id) <> ''
        AND check_in_date IS NOT NULL
        AND (
            venue_id IS NULL
            OR EXISTS (
                SELECT 1
                FROM public.venues v
                WHERE v.id = qr_checkins.venue_id
                  AND v.is_active = true
            )
        )
    );

DROP POLICY IF EXISTS "Allow authenticated full access" ON public.qr_checkins;
CREATE POLICY "Allow authenticated full access"
    ON public.qr_checkins
    FOR ALL
    TO authenticated
    USING (
        venue_id IS NULL
        OR EXISTS (
            SELECT 1
            FROM public.user_venues uv
            WHERE uv.user_id = auth.uid()
              AND uv.venue_id = qr_checkins.venue_id
        )
    )
    WITH CHECK (
        venue_id IS NULL
        OR EXISTS (
            SELECT 1
            FROM public.user_venues uv
            WHERE uv.user_id = auth.uid()
              AND uv.venue_id = qr_checkins.venue_id
        )
    );

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
DECLARE
    ext_schema text;
    relocatable boolean;
    ext_version text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'btree_gist') THEN
        SELECT n.nspname, e.extrelocatable
        INTO ext_schema, relocatable
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'btree_gist';

        IF ext_schema = 'public' AND relocatable THEN
            ALTER EXTENSION btree_gist SET SCHEMA extensions;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
        SELECT n.nspname, e.extrelocatable, e.extversion
        INTO ext_schema, relocatable, ext_version
        FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_net';

        IF ext_schema = 'public' THEN
            IF relocatable THEN
                ALTER EXTENSION pg_net SET SCHEMA extensions;
            ELSE
                -- Fallback for non-relocatable installs: reinstall into `extensions`.
                DROP EXTENSION pg_net;
                IF ext_version IS NOT NULL THEN
                    EXECUTE format(
                        'CREATE EXTENSION pg_net WITH SCHEMA extensions VERSION %L',
                        ext_version
                    );
                ELSE
                    CREATE EXTENSION pg_net WITH SCHEMA extensions;
                END IF;
            END IF;
        END IF;
    END IF;
END $$;
