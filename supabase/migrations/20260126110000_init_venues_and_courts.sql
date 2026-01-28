- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    operating_hours_start INTEGER DEFAULT 8,
    operating_hours_end INTEGER DEFAULT 23,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'phone') THEN
        ALTER TABLE venues ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'address') THEN
        ALTER TABLE venues ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'email') THEN
        ALTER TABLE venues ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'operating_hours_start') THEN
        ALTER TABLE venues ADD COLUMN operating_hours_start INTEGER DEFAULT 8;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'operating_hours_end') THEN
        ALTER TABLE venues ADD COLUMN operating_hours_end INTEGER DEFAULT 23;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'is_active') THEN
        ALTER TABLE venues ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'created_at') THEN
        ALTER TABLE venues ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'updated_at') THEN
        ALTER TABLE venues ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Insert default venue
INSERT INTO venues (id, name, address, phone) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'GOR Badminton Center',
    'Jl. Olahraga No. 123',
    '08123456789'
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS for venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Create courts table
CREATE TABLE IF NOT EXISTS courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    court_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    hourly_rate DECIMAL(10,2) DEFAULT 50000,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if courts table was already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'venue_id') THEN
        ALTER TABLE courts ADD COLUMN venue_id UUID REFERENCES venues(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'court_number') THEN
        ALTER TABLE courts ADD COLUMN court_number INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'is_active') THEN
        ALTER TABLE courts ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'hourly_rate') THEN
        ALTER TABLE courts ADD COLUMN hourly_rate DECIMAL(10,2) DEFAULT 50000;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'notes') THEN
        ALTER TABLE courts ADD COLUMN notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'created_at') THEN
        ALTER TABLE courts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courts' AND column_name = 'updated_at') THEN
        ALTER TABLE courts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Fix duplicate court numbers (if any) before adding constraint
    UPDATE courts 
    SET court_number = c.rn 
    FROM (
        SELECT id, row_number() OVER (PARTITION BY venue_id ORDER BY created_at) as rn 
        FROM courts
    ) c 
    WHERE courts.id = c.id AND (courts.court_number = 0 OR courts.court_number IS NULL);
END $$;

-- Add indexes for courts
CREATE INDEX IF NOT EXISTS idx_courts_venue_id ON courts(venue_id);
CREATE INDEX IF NOT EXISTS idx_courts_active ON courts(is_active);

-- Add unique constraint for courts
ALTER TABLE courts DROP CONSTRAINT IF EXISTS unique_venue_court_number;
ALTER TABLE courts ADD CONSTRAINT unique_venue_court_number 
    UNIQUE(venue_id, court_number);

-- Insert default courts
INSERT INTO courts (venue_id, name, court_number, is_active, hourly_rate) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Court 1', 1, true, 50000),
    ('00000000-0000-0000-0000-000000000001', 'Court 2', 2, true, 50000),
    ('00000000-0000-0000-0000-000000000001', 'Court 3', 3, true, 50000),
    ('00000000-0000-0000-0000-000000000001', 'Court 4', 4, true, 50000)
ON CONFLICT (venue_id, court_number) DO NOTHING;

-- Enable RLS for courts
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming auth is not fully set up yet, we allow public access for now as per guide policies section effectively)
-- But wait, the guide section 4 sets up RLS properly.
-- I'll follow the guide's RLS recommendations in a later step or include them here?
-- The user said "starting with the Courts Management API".
-- If I add strict RLS now, and Auth isn't set up, everything might break if I don't add public policies.
-- The guide says:
-- "Public can view active courts"
-- "Public can create bookings"

-- Let's add the basic policies for Courts and Venues so they are usable.
-- Create policies safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'venues' AND policyname = 'Public can view active venues'
    ) THEN
        CREATE POLICY "Public can view active venues" ON venues FOR SELECT USING (is_active = true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'courts' AND policyname = 'Public can view active courts'
    ) THEN
        CREATE POLICY "Public can view active courts" ON courts FOR SELECT USING (is_active = true);
    END IF;
END $$;
