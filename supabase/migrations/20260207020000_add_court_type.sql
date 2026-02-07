ALTER TABLE courts ADD COLUMN IF NOT EXISTS court_type TEXT;

COMMENT ON COLUMN courts.court_type IS 'Type of the court surface, e.g., Vinyl, Interlock, Semen, Rumput Sintetis';