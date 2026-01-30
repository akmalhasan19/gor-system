-- Migration: Add subscription columns to venues table
-- This enables tiered access control (STARTER, PRO, BUSINESS)

-- Create ENUMs for subscription plan and status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        CREATE TYPE subscription_plan_type AS ENUM ('STARTER', 'PRO', 'BUSINESS');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
        CREATE TYPE subscription_status_type AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIAL');
    END IF;
END $$;

-- Add subscription columns to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS subscription_plan subscription_plan_type DEFAULT 'STARTER',
ADD COLUMN IF NOT EXISTS subscription_status subscription_status_type DEFAULT 'TRIAL',
ADD COLUMN IF NOT EXISTS subscription_valid_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_courts INTEGER DEFAULT 3;

-- Create function to update max_courts based on plan
CREATE OR REPLACE FUNCTION update_max_courts_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Set max_courts based on the subscription plan
    IF NEW.subscription_plan = 'STARTER' THEN
        NEW.max_courts := 3;
    ELSIF NEW.subscription_plan = 'PRO' THEN
        NEW.max_courts := 8;
    ELSIF NEW.subscription_plan = 'BUSINESS' THEN
        NEW.max_courts := 999; -- Effectively unlimited
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating max_courts
DROP TRIGGER IF EXISTS trigger_update_max_courts ON venues;
CREATE TRIGGER trigger_update_max_courts
    BEFORE INSERT OR UPDATE OF subscription_plan ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_max_courts_on_plan_change();

-- Create function to check court limit before inserting new court
CREATE OR REPLACE FUNCTION check_court_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    venue_max_courts INTEGER;
BEGIN
    -- Get current court count for this venue
    SELECT COUNT(*) INTO current_count FROM courts WHERE venue_id = NEW.venue_id;
    
    -- Get max_courts for this venue
    SELECT max_courts INTO venue_max_courts FROM venues WHERE id = NEW.venue_id;
    
    IF current_count >= venue_max_courts THEN
        RAISE EXCEPTION 'Court limit reached for this subscription plan. Please upgrade to add more courts.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce court limit
DROP TRIGGER IF EXISTS trigger_check_court_limit ON courts;
CREATE TRIGGER trigger_check_court_limit
    BEFORE INSERT ON courts
    FOR EACH ROW
    EXECUTE FUNCTION check_court_limit();

-- Update existing venues to have default subscription values
UPDATE venues
SET 
    subscription_plan = 'STARTER',
    subscription_status = 'TRIAL',
    max_courts = 3
WHERE subscription_plan IS NULL;
