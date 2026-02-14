CREATE OR REPLACE FUNCTION public.can_manage_venue(target_venue_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_venues
    WHERE venue_id = target_venue_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT auth.uid() = target_user_id;
$$;

DROP POLICY IF EXISTS "Public read access for bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public View Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public Create Bookings" ON public.bookings;
DROP POLICY IF EXISTS "Venue Members Access Bookings" ON public.bookings;

CREATE POLICY "Public View Bookings"
  ON public.bookings
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public Create Bookings"
  ON public.bookings
  FOR INSERT
  TO anon
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

CREATE POLICY "Venue Members Access Bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Venue Members Access Courts" ON public.courts;
DROP POLICY IF EXISTS "Public can view active courts" ON public.courts;

CREATE POLICY "Public can view active courts"
  ON public.courts
  FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can insert courts" ON public.courts;
CREATE POLICY "Authenticated users can insert courts"
  ON public.courts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_venue(venue_id));

DROP POLICY IF EXISTS "Authenticated users can update courts" ON public.courts;
CREATE POLICY "Authenticated users can update courts"
  ON public.courts
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_venue(venue_id))
  WITH CHECK (public.can_manage_venue(venue_id));

DROP POLICY IF EXISTS "Authenticated users can delete courts" ON public.courts;
CREATE POLICY "Authenticated users can delete courts"
  ON public.courts
  FOR DELETE
  TO authenticated
  USING (public.can_manage_venue(venue_id));

DROP POLICY IF EXISTS "Authenticated users can view their courts" ON public.courts;
CREATE POLICY "Authenticated users can view their courts"
  ON public.courts
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR venue_id IN (SELECT public.get_my_venue_ids())
  );

DROP POLICY IF EXISTS "Public can view active venues" ON public.venues;
DROP POLICY IF EXISTS "Public View Active Venues" ON public.venues;
DROP POLICY IF EXISTS "Venue Members View Venue" ON public.venues;

CREATE POLICY "Public View Active Venues"
  ON public.venues
  FOR SELECT
  TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view their venues" ON public.venues;
CREATE POLICY "Authenticated users can view their venues"
  ON public.venues
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR id IN (SELECT public.get_my_venue_ids())
  );

DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Authenticated users can insert venues"
  ON public.venues
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update their venues" ON public.venues;
CREATE POLICY "Authenticated users can update their venues"
  ON public.venues
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_venue(id))
  WITH CHECK (public.can_manage_venue(id));

DROP POLICY IF EXISTS "Authenticated users can delete their venues" ON public.venues;
CREATE POLICY "Authenticated users can delete their venues"
  ON public.venues
  FOR DELETE
  TO authenticated
  USING (public.is_venue_owner(id));

DROP POLICY IF EXISTS "Admins can do everything on products" ON public.products;
DROP POLICY IF EXISTS "Admins can do everything on transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can do everything on transaction_items" ON public.transaction_items;

DROP POLICY IF EXISTS "Venue Members Access Products" ON public.products;
CREATE POLICY "Venue Members Access Products"
  ON public.products
  FOR ALL
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Venue Members Access Transactions" ON public.transactions;
CREATE POLICY "Venue Members Access Transactions"
  ON public.transactions
  FOR ALL
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Venue Members Access Transaction Items" ON public.transaction_items;
CREATE POLICY "Venue Members Access Transaction Items"
  ON public.transaction_items
  FOR ALL
  TO authenticated
  USING (
    transaction_id IN (
      SELECT t.id
      FROM public.transactions t
      WHERE t.venue_id IN (SELECT public.get_my_venue_ids())
    )
  )
  WITH CHECK (
    transaction_id IN (
      SELECT t.id
      FROM public.transactions t
      WHERE t.venue_id IN (SELECT public.get_my_venue_ids())
    )
  );

DROP POLICY IF EXISTS "View Own Rows" ON public.user_venues;
DROP POLICY IF EXISTS "View Teammates" ON public.user_venues;

CREATE POLICY "View Own and Teammates"
  ON public.user_venues
  FOR SELECT
  TO authenticated
  USING (
    public.is_current_user(user_id)
    OR venue_id IN (SELECT public.get_my_venue_ids())
  );

DROP POLICY IF EXISTS "Insert Membership" ON public.user_venues;
CREATE POLICY "Insert Membership"
  ON public.user_venues
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_current_user(user_id)
    OR public.is_venue_owner(venue_id)
  );

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.payments;
CREATE POLICY "Enable read access for authenticated users"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.payments;
CREATE POLICY "Enable insert for authenticated users"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.payments;
CREATE POLICY "Enable update for authenticated users"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own verifications" ON public.phone_verifications;
CREATE POLICY "Users can view own verifications"
  ON public.phone_verifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own verifications" ON public.phone_verifications;
CREATE POLICY "Users can update own verifications"
  ON public.phone_verifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow insert during registration" ON public.phone_verifications;
CREATE POLICY "Allow insert during registration"
  ON public.phone_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Service role manages rate limits" ON public.phone_verification_rate_limits;
CREATE POLICY "Service role manages rate limits"
  ON public.phone_verification_rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view reminder logs for their venues" ON public.reminder_logs;
CREATE POLICY "Users can view reminder logs for their venues"
  ON public.reminder_logs
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can insert reminder logs for their venues" ON public.reminder_logs;
CREATE POLICY "Users can insert reminder logs for their venues"
  ON public.reminder_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can update reminder logs for their venues" ON public.reminder_logs;
CREATE POLICY "Users can update reminder logs for their venues"
  ON public.reminder_logs
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can view winback logs for their venues" ON public.winback_promo_logs;
CREATE POLICY "Users can view winback logs for their venues"
  ON public.winback_promo_logs
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can insert winback logs for their venues" ON public.winback_promo_logs;
CREATE POLICY "Users can insert winback logs for their venues"
  ON public.winback_promo_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can update winback logs for their venues" ON public.winback_promo_logs;
CREATE POLICY "Users can update winback logs for their venues"
  ON public.winback_promo_logs
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can view exit surveys for their venues" ON public.exit_surveys;
CREATE POLICY "Users can view exit surveys for their venues"
  ON public.exit_surveys
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can update exit surveys for their venues" ON public.exit_surveys;
CREATE POLICY "Users can update exit surveys for their venues"
  ON public.exit_surveys
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view maintenance tasks for their venues" ON public.maintenance_tasks;
CREATE POLICY "Users can view maintenance tasks for their venues"
  ON public.maintenance_tasks
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can insert maintenance tasks for their venues" ON public.maintenance_tasks;
CREATE POLICY "Users can insert maintenance tasks for their venues"
  ON public.maintenance_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can update maintenance tasks for their venues" ON public.maintenance_tasks;
CREATE POLICY "Users can update maintenance tasks for their venues"
  ON public.maintenance_tasks
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can delete maintenance tasks for their venues" ON public.maintenance_tasks;
CREATE POLICY "Users can delete maintenance tasks for their venues"
  ON public.maintenance_tasks
  FOR DELETE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can view their venue maintenance schedules" ON public.court_maintenance_schedules;
CREATE POLICY "Users can view their venue maintenance schedules"
  ON public.court_maintenance_schedules
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can insert their venue maintenance schedules" ON public.court_maintenance_schedules;
CREATE POLICY "Users can insert their venue maintenance schedules"
  ON public.court_maintenance_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can update their venue maintenance schedules" ON public.court_maintenance_schedules;
CREATE POLICY "Users can update their venue maintenance schedules"
  ON public.court_maintenance_schedules
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can delete their venue maintenance schedules" ON public.court_maintenance_schedules;
CREATE POLICY "Users can delete their venue maintenance schedules"
  ON public.court_maintenance_schedules
  FOR DELETE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Enable read access for venue team" ON public.shift_expenses;
CREATE POLICY "Enable read access for venue team"
  ON public.shift_expenses
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Enable insert for venue team" ON public.shift_expenses;
CREATE POLICY "Enable insert for venue team"
  ON public.shift_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Users can view subscription payments in own venue" ON public.subscription_payments;
CREATE POLICY "Users can view subscription payments in own venue"
  ON public.subscription_payments
  FOR SELECT
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.shifts;
CREATE POLICY "Enable insert access for authenticated users"
  ON public.shifts
  FOR INSERT
  TO authenticated
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.shifts;
CREATE POLICY "Enable update access for authenticated users"
  ON public.shifts
  FOR UPDATE
  TO authenticated
  USING (venue_id IN (SELECT public.get_my_venue_ids()))
  WITH CHECK (venue_id IN (SELECT public.get_my_venue_ids()));

DROP POLICY IF EXISTS "Allow authenticated full access" ON public.qr_checkins;
CREATE POLICY "Allow authenticated full access"
  ON public.qr_checkins
  FOR ALL
  TO authenticated
  USING (
    venue_id IS NULL
    OR venue_id IN (SELECT public.get_my_venue_ids())
  )
  WITH CHECK (
    venue_id IS NULL
    OR venue_id IN (SELECT public.get_my_venue_ids())
  );

DROP POLICY IF EXISTS "Platform admins can view own row" ON public.platform_admins;
CREATE POLICY "Platform admins can view own row"
  ON public.platform_admins
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP INDEX IF EXISTS public.idx_bookings_time_range;
DROP INDEX IF EXISTS public.idx_customers_venue;
DROP INDEX IF EXISTS public.idx_products_venue;
DROP INDEX IF EXISTS public.idx_transactions_venue;