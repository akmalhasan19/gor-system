-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admin) via DO block to avoid errors
DO $$
BEGIN
    -- Venues
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Admins can do everything on venues') THEN
        CREATE POLICY "Admins can do everything on venues" ON venues FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Courts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courts' AND policyname = 'Admins can do everything on courts') THEN
        CREATE POLICY "Admins can do everything on courts" ON courts FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Bookings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Admins can do everything on bookings') THEN
        CREATE POLICY "Admins can do everything on bookings" ON bookings FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    -- Customers
    -- IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Admins can do everything on customers') THEN
    --     CREATE POLICY "Admins can do everything on customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
    -- END IF;

    -- Products
    -- IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Admins can do everything on products') THEN
    --     CREATE POLICY "Admins can do everything on products" ON products FOR ALL USING (auth.role() = 'authenticated');
    -- END IF;

    -- Transactions
    -- IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Admins can do everything on transactions') THEN
    --     CREATE POLICY "Admins can do everything on transactions" ON transactions FOR ALL USING (auth.role() = 'authenticated');
    -- END IF;

    -- Transaction Items
    -- IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transaction_items' AND policyname = 'Admins can do everything on transaction_items') THEN
    --     CREATE POLICY "Admins can do everything on transaction_items" ON transaction_items FOR ALL USING (auth.role() = 'authenticated');
    -- END IF;
END $$;


-- Public policies for Bookings (Allow insert for public booking form later)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can create bookings') THEN
        CREATE POLICY "Public can create bookings" ON bookings FOR INSERT WITH CHECK (true);
    END IF;

    -- Allow public to view their OWN bookings? 
    -- Typically requires a token or session reference, but for now we might leave it open or use a shared secret.
    -- The guide suggested:
    -- CREATE POLICY "Public can view their own bookings" ON bookings FOR SELECT USING (true);
    -- "true" means they can view ALL bookings. That's probably needed for the Scheduler view on public API.
    -- Yes, the public schedule shows valid bookings (without phone/name details maybe?).
    -- But RLS applies to API select.
    -- If public schedule API uses service_role, it bypasses RLS.
    -- If it uses anon key, it hits RLS.
    -- For now, let's allow Public Read on Bookings to see availability.
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can view bookings') THEN
        CREATE POLICY "Public can view bookings" ON bookings FOR SELECT USING (true);
    END IF;
END $$;
