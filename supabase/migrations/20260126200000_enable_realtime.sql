-- Enable replication for realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE bookings, venues, courts;
