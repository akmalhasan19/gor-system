-- Add metadata column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata (optional but good for querying)
CREATE INDEX IF NOT EXISTS idx_transactions_metadata ON transactions USING gin (metadata);