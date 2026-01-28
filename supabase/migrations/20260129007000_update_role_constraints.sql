-- Update the check constraint for user_venues to include 'cashier'
-- First, drop the existing constraint
ALTER TABLE user_venues DROP CONSTRAINT IF EXISTS user_venues_role_check;

-- Add the new constraint with 'cashier' added
ALTER TABLE user_venues ADD CONSTRAINT user_venues_role_check 
    CHECK (role IN ('owner', 'manager', 'staff', 'cashier'));

-- Comment on column to document roles
COMMENT ON COLUMN user_venues.role IS 'Role of the user in the venue: owner, manager, staff, or cashier';
