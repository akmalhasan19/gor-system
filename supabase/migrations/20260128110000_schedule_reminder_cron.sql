- Migration: Schedule daily reminder cron job
-- Date: 2026-01-28
-- This schedules the check-expiring-members Edge Function to run daily at 09:00 WIB (02:00 UTC)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Store secrets in Vault for secure access
-- Note: These need to be set manually in Supabase Dashboard > Settings > Vault
-- INSERT INTO vault.secrets (name, secret) VALUES ('project_url', 'https://your-project-ref.supabase.co');
-- INSERT INTO vault.secrets (name, secret) VALUES ('anon_key', 'your-anon-key');

-- Schedule the cron job to run daily at 02:00 UTC (09:00 WIB)
SELECT cron.schedule(
    'check-expiring-members-daily',
    '0 2 * * *', -- Every day at 02:00 UTC (09:00 WIB)
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/check-expiring-members',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key')
        ),
        body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
    $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('check-expiring-members-daily');
