- Create user_venues table for multi-tenant architecture
-- This enables each auth user to be associated with one or more venues

CREATE TABLE IF NOT EXISTS user_venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, venue_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_venues_user ON user_venues(user_id);
CREATE INDEX IF NOT EXISTS idx_user_venues_venue ON user_venues(venue_id);

-- Enable Row Level Security
ALTER TABLE user_venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_venues table
DO $$
BEGIN
    -- Users can view their own venue associations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_venues' 
        AND policyname = 'Users can view their venue associations'
    ) THEN
        CREATE POLICY "Users can view their venue associations"
            ON user_venues FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    -- Users can create venue associations during onboarding
    -- (they can only create associations for themselves)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_venues' 
        AND policyname = 'Users can create venue associations during onboarding'
    ) THEN
        CREATE POLICY "Users can create venue associations during onboarding"
            ON user_venues FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Only owners can update venue associations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_venues' 
        AND policyname = 'Owners can update venue associations'
    ) THEN
        CREATE POLICY "Owners can update venue associations"
            ON user_venues FOR UPDATE
            USING (auth.uid() = user_id AND role = 'owner');
    END IF;

    -- Only owners can delete venue associations
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_venues' 
        AND policyname = 'Owners can delete venue associations'
    ) THEN
        CREATE POLICY "Owners can delete venue associations"
            ON user_venues FOR DELETE
            USING (auth.uid() = user_id AND role = 'owner');
    END IF;
END $$;

-- Migration: Associate existing auth users with the default venue
-- This ensures existing test users continue to work
INSERT INTO user_venues (user_id, venue_id, role)
SELECT id, '00000000-0000-0000-0000-000000000001', 'owner'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM user_venues WHERE user_venues.user_id = auth.users.id
)
ON CONFLICT (user_id, venue_id) DO NOTHING;

-- Add updated_at trigger for user_venues
CREATE OR REPLACE FUNCTION update_user_venues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_venues_updated_at_trigger ON user_venues;
CREATE TRIGGER user_venues_updated_at_trigger
    BEFORE UPDATE ON user_venues
    FOR EACH ROW
    EXECUTE FUNCTION update_user_venues_updated_at();
