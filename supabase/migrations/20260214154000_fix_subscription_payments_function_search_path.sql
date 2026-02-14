-- Fix security warning: Function Search Path Mutable
-- Ensure trigger function runs with an explicit, safe search_path.
ALTER FUNCTION public.update_subscription_payments_updated_at()
SET search_path = public, pg_temp;
