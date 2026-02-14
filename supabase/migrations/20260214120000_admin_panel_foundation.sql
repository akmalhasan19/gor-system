CREATE TABLE IF NOT EXISTS public.platform_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'ops_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.venue_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('smashcourts', 'manual')),
    partner_name TEXT,
    venue_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    city TEXT,
    requested_plan public.subscription_plan_type DEFAULT 'STARTER',
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'TRIAL', 'ACTIVE', 'CHURN_RISK', 'REJECTED')),
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    provisioned_venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    metadata JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_role ON public.platform_admins(role);
CREATE INDEX IF NOT EXISTS idx_platform_admins_active ON public.platform_admins(is_active);

CREATE INDEX IF NOT EXISTS idx_venue_leads_status ON public.venue_leads(status);
CREATE INDEX IF NOT EXISTS idx_venue_leads_created_at ON public.venue_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_leads_email ON public.venue_leads(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_actor ON public.admin_audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venue_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view own row" ON public.platform_admins;
CREATE POLICY "Platform admins can view own row"
    ON public.platform_admins
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

GRANT SELECT ON public.platform_admins TO authenticated;

ALTER TABLE public.partner_invites
    ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.venue_leads(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS resend_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_partner_invites_lead_id ON public.partner_invites(lead_id);
CREATE INDEX IF NOT EXISTS idx_partner_invites_created_by_admin ON public.partner_invites(created_by_admin_id);

ALTER TABLE public.venues
    ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;

CREATE OR REPLACE FUNCTION public.update_platform_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_venue_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_platform_admins_updated_at ON public.platform_admins;
CREATE TRIGGER trigger_update_platform_admins_updated_at
    BEFORE UPDATE ON public.platform_admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_platform_admins_updated_at();

DROP TRIGGER IF EXISTS trigger_update_venue_leads_updated_at ON public.venue_leads;
CREATE TRIGGER trigger_update_venue_leads_updated_at
    BEFORE UPDATE ON public.venue_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.update_venue_leads_updated_at();