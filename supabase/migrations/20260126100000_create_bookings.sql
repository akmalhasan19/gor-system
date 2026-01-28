-- Bookings table migration
-- Creates bookings table with RLS policies for public access

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    start_time TEXT NOT NULL, -- Format: "HH:MM"
    duration INTEGER NOT NULL DEFAULT 1, -- in hours
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed')),
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'venue_id') THEN
        ALTER TABLE bookings ADD COLUMN venue_id UUID REFERENCES venues(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'court_id') THEN
        ALTER TABLE bookings ADD COLUMN court_id UUID REFERENCES courts(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'customer_name') THEN
        ALTER TABLE bookings ADD COLUMN customer_name TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'phone') THEN
        ALTER TABLE bookings ADD COLUMN phone TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'start_time') THEN
        ALTER TABLE bookings ADD COLUMN start_time TEXT NOT NULL DEFAULT '09:00';
    ELSE
        -- Convert start_time to TEXT if it's not already
        ALTER TABLE bookings ALTER COLUMN start_time TYPE TEXT USING start_time::TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'duration') THEN
        ALTER TABLE bookings ADD COLUMN duration INTEGER NOT NULL DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'price') THEN
        ALTER TABLE bookings ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'paid_amount') THEN
        ALTER TABLE bookings ADD COLUMN paid_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'status') THEN
        ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'booking_date') THEN
        ALTER TABLE bookings ADD COLUMN booking_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'notes') THEN
        ALTER TABLE bookings ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'created_at') THEN
        ALTER TABLE bookings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'updated_at') THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Add indexes for bookings
CREATE INDEX IF NOT EXISTS idx_bookings_venue_id ON bookings(venue_id);
CREATE INDEX IF NOT EXISTS idx_bookings_court_id ON bookings(court_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Enable RLS for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies safely
DO $$
BEGIN
    -- Policy: Public can view all bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can view bookings'
    ) THEN
        CREATE POLICY "Public can view bookings" ON bookings FOR SELECT USING (true);
    END IF;

    -- Policy: Public can create bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can create bookings'
    ) THEN
        CREATE POLICY "Public can create bookings" ON bookings FOR INSERT WITH CHECK (true);
    END IF;

    -- Policy: Public can update bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can update bookings'
    ) THEN
        CREATE POLICY "Public can update bookings" ON bookings FOR UPDATE USING (true);
    END IF;

    -- Policy: Public can delete bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Public can delete bookings'
    ) THEN
        CREATE POLICY "Public can delete bookings" ON bookings FOR DELETE USING (true);
    END IF;
END $$;

-- Comment on table
COMMENT ON TABLE bookings IS 'Stores court booking information for the GOR system';
