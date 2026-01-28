-- NUCLEAR FIX for Data Access RLS (Courts, Bookings, Transactions, etc.)
-- Ensure that any user belonging to a venue can access that venue's data.
-- This uses the Security Definer function 'get_my_venue_ids()' to prevent recursion.

-- 0. HELPER FUNCTION
CREATE OR REPLACE FUNCTION get_my_venue_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT venue_id FROM user_venues WHERE user_id = auth.uid()
$$;

-- 1. COURTS
DROP POLICY IF EXISTS "Admins can do everything on courts" ON courts;
DROP POLICY IF EXISTS "Public can view active courts" ON courts; -- Optional: Keep public view if needed, but usually redundant for staff

CREATE POLICY "Venue Members Access Courts"
    ON courts FOR ALL
    USING (
        venue_id IN (SELECT get_my_venue_ids()) 
        OR 
        is_active = true -- Keep public access for unauthenticated view if needed
    );

-- 2. BOOKINGS
DROP POLICY IF EXISTS "Admins can do everything on bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view bookings" ON bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON bookings;
DROP POLICY IF EXISTS "Public can update bookings" ON bookings;
DROP POLICY IF EXISTS "Public can delete bookings" ON bookings;

CREATE POLICY "Venue Members Access Bookings"
    ON bookings FOR ALL
    USING (venue_id IN (SELECT get_my_venue_ids()));

-- Re-add Public CREATE (for external booking forms)
CREATE POLICY "Public Create Bookings"
    ON bookings FOR INSERT
    WITH CHECK (true); 

-- Re-add Public READ (for public schedule)
CREATE POLICY "Public View Bookings"
    ON bookings FOR SELECT
    USING (true);

-- 3. CUSTOMERS
DROP POLICY IF EXISTS "Admins can do everything on customers" ON customers;

CREATE POLICY "Venue Members Access Customers"
    ON customers FOR ALL
    USING (venue_id IN (SELECT get_my_venue_ids()));

-- 4. PRODUCTS
DROP POLICY IF EXISTS "Admins can do everything on products" ON products;

CREATE POLICY "Venue Members Access Products"
    ON products FOR ALL
    USING (venue_id IN (SELECT get_my_venue_ids()));

-- 5. TRANSACTIONS
DROP POLICY IF EXISTS "Admins can do everything on transactions" ON transactions;

CREATE POLICY "Venue Members Access Transactions"
    ON transactions FOR ALL
    USING (venue_id IN (SELECT get_my_venue_ids()));

-- 6. TRANSACTION ITEMS
DROP POLICY IF EXISTS "Admins can do everything on transaction_items" ON transaction_items;

CREATE POLICY "Venue Members Access Transaction Items"
    ON transaction_items FOR ALL
    USING (
        transaction_id IN (
            SELECT id FROM transactions WHERE venue_id IN (SELECT get_my_venue_ids())
        )
    );

-- 7. VENUES (Read Access)
DROP POLICY IF EXISTS "Admins can do everything on venues" ON venues;
DROP POLICY IF EXISTS "Public can view active venues" ON venues;

CREATE POLICY "Venue Members View Venue"
    ON venues FOR SELECT
    USING (id IN (SELECT get_my_venue_ids()));

CREATE POLICY "Public View Active Venues"
    ON venues FOR SELECT
    USING (is_active = true);
