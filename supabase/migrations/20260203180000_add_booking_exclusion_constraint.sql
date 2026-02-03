-- Migration: Add Booking Exclusion Constraint
-- Purpose: Prevent double-booking at the database level (race condition fix)

-- 1. Enable btree_gist extension (required for exclusion constraints)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Add normal columns for start and end timestamps (NOT generated)
-- We use a Trigger to populate these, avoiding "immutable" errors.
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS start_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_timestamp TIMESTAMP;

-- 3. Create a function to calculate timestamps automatically
CREATE OR REPLACE FUNCTION update_booking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- booking_date is DATE, start_time is TEXT ('HH:MM')
    -- We can safely do math here without caring about immutability restrictions
    NEW.start_timestamp := (NEW.booking_date + NEW.start_time::time);
    
    -- Calculate end time based on duration (integer hours)
    NEW.end_timestamp := NEW.start_timestamp + (NEW.duration || ' hours')::interval;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create Trigger to run BEFORE Insert or Update
DROP TRIGGER IF EXISTS set_booking_timestamps ON bookings;

CREATE TRIGGER set_booking_timestamps
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_timestamps();

-- 5. Backfill existing data (if any) so the constraint doesn't fail on creation
-- This is necessary if you have existing rows.
UPDATE bookings 
SET start_timestamp = (booking_date + start_time::time),
    end_timestamp = (booking_date + start_time::time + (duration || ' hours')::interval)
WHERE start_timestamp IS NULL;

-- 6. Create the exclusion constraint
-- We use tsrange (timestamp range without timezone)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_bookings'
    ) THEN
        ALTER TABLE bookings
        ADD CONSTRAINT no_overlapping_bookings
        EXCLUDE USING gist (
            court_id WITH =,
            tsrange(start_timestamp, end_timestamp, '[)') WITH &&
        )
        WHERE (status <> 'cancelled');
    END IF;
END $$;

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_time_range 
ON bookings USING gist (court_id, tsrange(start_timestamp, end_timestamp, '[)'))
WHERE status <> 'cancelled';

COMMENT ON CONSTRAINT no_overlapping_bookings ON bookings IS 'Prevents double-booking by ensuring no two active bookings for the same court can have overlapping time ranges.';
