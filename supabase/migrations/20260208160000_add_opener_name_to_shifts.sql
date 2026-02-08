ALTER TABLE public.shifts 
ADD COLUMN opener_name text;

COMMENT ON COLUMN public.shifts.opener_name IS 'Name of the person who opened the shift (manual input)';