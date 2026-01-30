
-- Enable replication for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- Ensure replica identity (optional but good for UPDATEs)
ALTER TABLE payments REPLICA IDENTITY FULL;
