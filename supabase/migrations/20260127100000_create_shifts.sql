- Create shifts table for cashier management
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    opener_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who opened the shift
    closer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who closed the shift
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    start_cash DECIMAL(10,2) NOT NULL DEFAULT 0,
    end_cash DECIMAL(10,2), -- Actual cash counted
    expected_cash DECIMAL(10,2), -- System calculated cash expected
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_venue_id ON shifts(venue_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON shifts(start_time);

-- RLS Policies
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Public/Authenticated users can view shifts (refined later for specific roles if needed)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON shifts FOR SELECT TO authenticated USING (true);
    END IF;

    -- Public/Authenticated users can insert shifts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Enable insert access for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert access for authenticated users" ON shifts FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    -- Public/Authenticated users can update shifts
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'shifts' AND policyname = 'Enable update access for authenticated users'
    ) THEN
        CREATE POLICY "Enable update access for authenticated users" ON shifts FOR UPDATE TO authenticated USING (true);
    END IF;
END $$;

COMMENT ON TABLE shifts IS 'Tracks cashier shifts, open/close times, and cash reconciliation';
