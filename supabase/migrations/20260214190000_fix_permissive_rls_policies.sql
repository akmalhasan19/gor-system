DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.payments;
CREATE POLICY "Enable insert for authenticated users"
  ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.payments;
CREATE POLICY "Enable update for authenticated users"
  ON public.payments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Authenticated users can insert venues"
  ON public.venues
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);