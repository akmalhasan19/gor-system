-- Drop existing check constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_status_check') THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
    END IF;
END $$;

-- Add updated check constraint with new values
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed', 'LUNAS', 'DP', 'BELUM_BAYAR'));
