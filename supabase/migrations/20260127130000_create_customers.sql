-- Create customers table
-- Inferred relative path: supabase/migrations/20260127130000_create_customers.sql

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    is_member BOOLEAN DEFAULT false,
    quota INTEGER DEFAULT 0,
    membership_expiry TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_customers_venue_id ON customers(venue_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Admins can do everything on customers') THEN
        CREATE POLICY "Admins can do everything on customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
