ALTER TABLE venues
ADD COLUMN IF NOT EXISTS pending_subscription_plan subscription_plan_type,
ADD COLUMN IF NOT EXISTS pending_subscription_effective_date TIMESTAMPTZ;